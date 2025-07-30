import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
    forwardRef,
    Inject
} from '@nestjs/common';
import { TrackingEventType } from 'generated/prisma';
import {
    UpdateDriverLocationDto,
    LocationSearchDto,
    DriverLocationResponseDto,
    LocationSuggestionDto,
    NotifyPickupDto,
    NotifyReceiverPickupDto,
    ConfirmManualDeliveryDto
} from './dtos/driver-location.dto';
import { DriverLocationI } from './interfaces/driver-location.interface';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { ParcelsService } from '../parcels/parcels.service';
import { LocationAutocompleteService } from './location-autocomplete/location-autocomplete.service';
import { ParcelStatus } from '../parcels/dtos';

@Injectable()
export class DriversService {
    private readonly logger = new Logger(DriversService.name);
    private readonly DELIVERY_THRESHOLD_METERS = 100;

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailerService: MailerService,
        @Inject(forwardRef(() => ParcelsService))
        private readonly parcelsService: ParcelsService,
        private readonly locationAutocompleteService: LocationAutocompleteService,
    ) {}

    // Core location management
    async updateDriverLocation(
        driverId: string,
        updateLocationDto: UpdateDriverLocationDto
    ): Promise<DriverLocationResponseDto> {
        const { latitude, longitude, address } = updateLocationDto;

        // Validate input
        this.validateCoordinates(latitude, longitude);

        // Get address if not provided
        const finalAddress = address ||
            await this.locationAutocompleteService.reverseGeocode(latitude, longitude);

        // Create location record
        const driverLocation = await this.createDriverLocationRecord(
            driverId,
            latitude,
            longitude,
            finalAddress
        );

        // Process parcel updates
        const affectedParcels = await this.processParcelUpdates(
            driverId,
            { latitude, longitude },
            finalAddress
        );

        this.logger.log(`Driver ${driverId} location updated. Affected ${affectedParcels.length} parcels`);

        return {
            ...this.formatDriverLocation(driverLocation),
            affectedParcels,
        };
    }

    async getDriverLocations(driverId: string): Promise<DriverLocationI[]> {
        const locations = await this.prisma.driverLocation.findMany({
            where: { driverId },
            orderBy: { timestamp: 'desc' },
            take: 50,
        });

        return locations.map(location => this.formatDriverLocation(location));
    }

    async getDriverCurrentLocation(driverId: string): Promise<DriverLocationI | null> {
        const location = await this.prisma.driverLocation.findFirst({
            where: { driverId },
            orderBy: { timestamp: 'desc' },
        });

        return location ? this.formatDriverLocation(location) : null;
    }

    async searchLocations(searchDto: LocationSearchDto): Promise<LocationSuggestionDto[]> {
        try {
            const suggestions = await this.locationAutocompleteService.searchLocations(
                searchDto.query,
                searchDto.limit
            );

            return suggestions.map(suggestion => ({
                displayName: suggestion.displayName,
                address: suggestion.address,
                latitude: suggestion.latitude,
                longitude: suggestion.longitude,
                type: suggestion.type,
            }));
        } catch (error) {
            this.logger.error(`Location search failed for query: ${searchDto.query}`, error);
            throw new BadRequestException('Location search failed');
        }
    }

    // Parcel management
    async getDriverAssignedParcels(driverId: string) {
        return this.prisma.parcel.findMany({
            where: {
                driverId,
                status: {
                    notIn: ['DELIVERED', 'COMPLETED', 'CANCELLED']
                },
                isActive: true,
            },
            include: {
                destinationLocation: true,
                pickupLocation: true,
                sender: { select: { name: true, email: true, phone: true } },
                receiver: { select: { name: true, email: true, phone: true } },
                trackingEvents: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    // Notification methods
    async notifyParcelPickup(
        driverId: string,
        parcelId: string,
        pickupData?: NotifyPickupDto
    ): Promise<void> {
        this.logger.log(`Processing pickup notification for parcel ${parcelId} by driver ${driverId}`);

        const parcel = await this.getParcelWithDetails(parcelId);
        this.validateDriverAssignment(parcel, driverId);

        const driver = await this.getDriverDetails(driverId);
        const pickupLocation = pickupData?.pickupLocation || parcel.pickupLocation?.address;

        // Update status and create tracking event
        await this.updateParcelStatusWithEvent(
            parcel.id,
            'PICKED_UP',
            pickupLocation,
            TrackingEventType.PICKED_UP,
            `Parcel picked up by driver ${driver?.name || 'Driver'}`,
            driverId
        );

        // Send notification
        if (parcel.sender?.email) {
            await this.mailerService.sendPickupNotification(
                parcel.sender.email,
                parcel.sender.name || 'Sender',
                parcel.trackingNumber,
                pickupLocation,
                driver?.name,
                driver?.phone || undefined
            );
        }

        this.logger.log(`Pickup notification completed for parcel ${parcel.trackingNumber}`);
    }

    async notifyReceiverForPickup(
        driverId: string,
        parcelId: string,
        notifyData?: NotifyReceiverPickupDto
    ): Promise<void> {
        const parcel = await this.getParcelWithDetails(parcelId);
        this.validateDriverAssignment(parcel, driverId);

        const driver = await this.getDriverDetails(driverId);
        const location = notifyData?.arrivalLocation || parcel.destinationLocation?.address;

        // Update status and create tracking event
        await this.updateParcelStatusWithEvent(
            parcel.id,
            'ARRIVED_AT_DESTINATION',
            location,
            TrackingEventType.ARRIVED_AT_DESTINATION,
            'Driver arrived at destination. Ready for pickup.',
            driverId
        );

        // Send notification
        if (parcel.receiver?.email) {
            await this.mailerService.sendReceiverPickupNotification(
                parcel.receiver.email,
                parcel.receiver.name || 'Recipient',
                parcel.trackingNumber,
                location,
                notifyData?.pickupInstructions,
                driver?.name,
                driver?.phone || undefined
            );
        }

        this.logger.log(`Receiver pickup notification sent for parcel ${parcel.trackingNumber}`);
    }

    async confirmManualDelivery(
        driverId: string,
        parcelId: string,
        deliveryData?: ConfirmManualDeliveryDto
    ): Promise<void> {
        const parcel = await this.getParcelWithDetails(parcelId);
        this.validateDriverAssignment(parcel, driverId);

        const location = deliveryData?.deliveryLocation || parcel.destinationLocation?.address;
        const driverLocation = await this.getDriverCurrentLocation(driverId);

        const coordinates = driverLocation ?
            { latitude: driverLocation.latitude, longitude: driverLocation.longitude } :
            { latitude: parcel.destinationLocation.latitude, longitude: parcel.destinationLocation.longitude };

        // Deliver the parcel
        await this.deliverParcel(parcel, coordinates, location, driverId);

        // Add delivery notes if provided
        if (deliveryData?.deliveryNotes) {
            await this.parcelsService.createTrackingEvent({
                parcelId: parcel.id,
                type: TrackingEventType.DELIVERED,
                status: 'Delivery Note',
                location,
                description: deliveryData.deliveryNotes,
                driverId,
                automated: false,
            });
        }

        this.logger.log(`Manual delivery confirmed for parcel ${parcel.trackingNumber}`);
    }

    // Private helper methods
    private async createDriverLocationRecord(
        driverId: string,
        latitude: number,
        longitude: number,
        address: string
    ) {
        return this.prisma.driverLocation.create({
            data: {
                driverId,
                latitude,
                longitude,
                address,
                timestamp: new Date(),
            },
        });
    }

    private async processParcelUpdates(
        driverId: string,
        coordinates: { latitude: number; longitude: number },
        address: string
    ): Promise<Array<{
        id: string;
        trackingNumber: string;
        status: string;
        action: 'delivered' | 'location_updated';
    }>> {
        const parcels = await this.getDriverAssignedParcels(driverId);
        const affectedParcels: Array<{
            id: string;
            trackingNumber: string;
            status: string;
            action: 'delivered' | 'location_updated';
        }> = [];

        for (const parcel of parcels) {
            if (this.isAtDestination(coordinates, parcel.destinationLocation)) {
                await this.deliverParcel(parcel, coordinates, address, driverId);
                affectedParcels.push({
                    id: parcel.id,
                    trackingNumber: parcel.trackingNumber,
                    status: 'DELIVERED',
                    action: 'delivered' as const,
                });
            } else {
                await this.updateParcelInTransit(parcel, coordinates, address, driverId);
                affectedParcels.push({
                    id: parcel.id,
                    trackingNumber: parcel.trackingNumber,
                    status: 'IN_TRANSIT',
                    action: 'location_updated' as const,
                });
            }
        }

        return affectedParcels;
    }

    private async deliverParcel(
        parcel: any,
        coordinates: { latitude: number; longitude: number },
        address: string,
        driverId: string
    ) {
        // Update status with coordinates
        await this.parcelsService.updateStatus(
            parcel.id,
            'DELIVERED' as any,
            address,
            { lat: coordinates.latitude, lng: coordinates.longitude }
        );

        // Create tracking event
        await this.parcelsService.createTrackingEvent({
            parcelId: parcel.id,
            type: TrackingEventType.DELIVERED,
            status: 'Delivered',
            location: address,
            coordinates: { lat: coordinates.latitude, lng: coordinates.longitude },
            description: `Parcel delivered at ${address}`,
            driverId,
            automated: true,
        });

        // Send notifications
        await this.sendDeliveryNotifications(parcel, address);

        this.logger.log(`Parcel ${parcel.trackingNumber} delivered by driver ${driverId}`);
    }

    private async updateParcelInTransit(
        parcel: any,
        coordinates: { latitude: number; longitude: number },
        address: string,
        driverId: string
    ) {
        await this.parcelsService.updateStatus(
            parcel.id,
            'IN_TRANSIT' as any,
            address,
            { lat: coordinates.latitude, lng: coordinates.longitude }
        );

        await this.parcelsService.createTrackingEvent({
            parcelId: parcel.id,
            type: TrackingEventType.LOCATION_UPDATE,
            status: 'In Transit',
            location: address,
            coordinates: { lat: coordinates.latitude, lng: coordinates.longitude },
            description: `Driver location updated: ${address}`,
            driverId,
            automated: true,
        });

        // Send throttled location updates
        if (await this.shouldSendLocationNotification(parcel.id) && parcel.receiver?.email) {
            await this.mailerService.sendLocationUpdateNotification(
                parcel.receiver.email,
                parcel.receiver.name || 'Recipient',
                parcel.trackingNumber,
                address
            );
        }
    }

    private async sendDeliveryNotifications(parcel: any, address: string) {
        const deliveryTime = new Date().toLocaleString();

        // Notify receiver
        if (parcel.receiver?.email) {
            await this.mailerService.sendDeliveryNotification(
                parcel.receiver.email,
                parcel.receiver.name || 'Recipient',
                parcel.trackingNumber,
                address
            );
        }

        // Notify sender
        if (parcel.sender?.email) {
            await this.mailerService.sendSenderDeliveryConfirmation(
                parcel.sender.email,
                parcel.sender.name || 'Sender',
                parcel.receiver.name || 'Recipient',
                parcel.trackingNumber,
                address,
                deliveryTime
            );
        }
    }

    private async getParcelWithDetails(parcelId: string) {
        const parcel = await this.prisma.parcel.findUnique({
            where: { id: parcelId },
            include: {
                sender: { select: { name: true, email: true, phone: true } },
                receiver: { select: { name: true, email: true, phone: true } },
                destinationLocation: true,
                pickupLocation: true,
            },
        });

        if (!parcel) {
            throw new NotFoundException(`Parcel with ID ${parcelId} not found`);
        }

        return parcel;
    }

    private async getDriverDetails(driverId: string) {
        return this.prisma.user.findUnique({
            where: { id: driverId },
            select: { name: true, phone: true },
        });
    }

    private validateDriverAssignment(parcel: any, driverId: string) {
        if (parcel.driverId !== driverId) {
            throw new BadRequestException('Driver not assigned to this parcel');
        }
    }

    private async updateParcelStatusWithEvent(
        parcelId: string,
        status: string,
        location: string,
        eventType: TrackingEventType,
        description: string,
        driverId: string
    ) {
        await this.parcelsService.updateStatus(parcelId, status as any, location);

        await this.parcelsService.createTrackingEvent({
            parcelId,
            type: eventType,
            status: status.replace('_', ' '),
            location,
            description,
            driverId,
            automated: false,
        });
    }

    private isAtDestination(
        current: { latitude: number; longitude: number },
        destination: { latitude: number; longitude: number }
    ): boolean {
        const distance = this.calculateDistance(current, destination);
        return distance <= this.DELIVERY_THRESHOLD_METERS;
    }

    private calculateDistance(
        point1: { latitude: number; longitude: number },
        point2: { latitude: number; longitude: number }
    ): number {
        const EARTH_RADIUS = 6371000; // meters
        const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

        const lat1Rad = toRadians(point1.latitude);
        const lat2Rad = toRadians(point2.latitude);
        const latDiff = toRadians(point2.latitude - point1.latitude);
        const lngDiff = toRadians(point2.longitude - point1.longitude);

        const haversine = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(lngDiff / 2) * Math.sin(lngDiff / 2);

        const distance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
        return EARTH_RADIUS * distance;
    }

    private async shouldSendLocationNotification(parcelId: string): Promise<boolean> {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const recentNotification = await this.prisma.trackingEvent.findFirst({
            where: {
                parcelId,
                type: TrackingEventType.LOCATION_UPDATE,
                createdAt: { gte: thirtyMinutesAgo },
            },
        });

        return !recentNotification;
    }

    private validateCoordinates(latitude: number, longitude: number): void {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new BadRequestException('Invalid coordinates');
        }
    }

    private formatDriverLocation(location: any): DriverLocationI {
        return {
            id: location.id,
            driverId: location.driverId,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            timestamp: location.timestamp.toISOString(),
        };
    }
}