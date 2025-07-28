import {Injectable, NotFoundException, BadRequestException, Logger, forwardRef, Inject} from '@nestjs/common';

import {TrackingEventType} from 'generated/prisma';
import {
    UpdateDriverLocationDto,
    LocationSearchDto,
    DriverLocationResponseDto,
    LocationSuggestionDto
} from './dtos/driver-location.dto';
import {
    DriverLocationI,
    LocationProximityCheck,
    LocationSuggestion, LocationUpdateResult
} from './interfaces/driver-location.interface';
import {PrismaService} from "../prisma/prisma.service";
import {MailerService} from "../mailer/mailer.service";
import {ParcelsService} from "../parcels/parcels.service";
import {LocationService} from "../location/location.service";
import {LocationAutocompleteService} from "./location-autocomplete/location-autocomplete.service";
import {ParcelStatus} from "../parcels/dtos";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class DriversService {
    private readonly logger = new Logger(DriversService.name);
    private readonly DELIVERY_THRESHOLD_METERS = 100; // 100 meters threshold for delivery

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => ParcelsService))
        private readonly parcelsService: ParcelsService,
        private readonly locationService: LocationService,
        private readonly locationAutocompleteService: LocationAutocompleteService,
    ) {
    }

    async updateDriverLocation(
        driverId: string,
        updateLocationDto: UpdateDriverLocationDto
    ): Promise<DriverLocationResponseDto> {
        const {latitude, longitude, address} = updateLocationDto;

        try {
            // Validate coordinates
            this.validateCoordinates(latitude, longitude);

            // Get or create readable address if not provided
            let finalAddress = address;
            if (!finalAddress) {
                finalAddress = await this.locationAutocompleteService.reverseGeocode(latitude, longitude);
            }

            // Create driver location record
            const driverLocation = await this.prisma.driverLocation.create({
                data: {
                    driverId,
                    latitude,
                    longitude,
                    address: finalAddress,
                    timestamp: new Date(),
                },
            });

            // Process parcels assigned to this driver
            const locationUpdateResult = await this.processParcelLocationUpdates(
                driverId,
                {latitude, longitude},
                finalAddress
            );

            const response: DriverLocationResponseDto = {
                ...this.transformToDriverLocationInterface(driverLocation),
                affectedParcels: locationUpdateResult.affectedParcels,
            };

            this.logger.log(`Driver ${driverId} location updated. Affected ${locationUpdateResult.affectedParcels.length} parcels`);

            return response;

        } catch (error) {
            this.logger.error(`Failed to update driver location for ${driverId}`, error);
            throw error;
        }
    }

    async getDriverLocations(driverId: string): Promise<DriverLocationI[]> {
        const locations = await this.prisma.driverLocation.findMany({
            where: {driverId},
            orderBy: {timestamp: 'desc'},
            take: 50, // Limit to last 50 locations
        });

        return locations.map(location => this.transformToDriverLocationInterface(location));
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
            this.logger.error(`Failed to search locations for query: ${searchDto.query}`, error);
            throw new BadRequestException('Location search failed');
        }
    }

    async getDriverCurrentLocation(driverId: string): Promise<DriverLocationI | null> {
        const location = await this.prisma.driverLocation.findFirst({
            where: {driverId},
            orderBy: {timestamp: 'desc'},
        });

        return location ? this.transformToDriverLocationInterface(location) : null;
    }

    async getDriverAssignedParcels(driverId: string) {
        return this.prisma.parcel.findMany({
            where: {
                driverId,
                status: {
                    notIn: [ParcelStatus.DELIVERED, ParcelStatus.COMPLETED, ParcelStatus.CANCELLED]
                },
                isActive: true,
            },
            include: {
                destinationLocation: true,
                sender: {select: {name: true, email: true, phone: true}},
                receiver: {select: {name: true, email: true, phone: true}},
            },
            orderBy: {createdAt: 'asc'},
        });
    }

    private async processParcelLocationUpdates(
        driverId: string,
        coordinates: { latitude: number; longitude: number },
        address: string,
    ): Promise<LocationUpdateResult> {
        const parcels = await this.getDriverAssignedParcels(driverId);
        const affectedParcels: Array<{
            id: string;
            trackingNumber: string;
            status: ParcelStatus;
            action: 'delivered' | 'location_updated';
        }> = [];

        for (const parcel of parcels) {
            const destination = parcel.destinationLocation;
            const proximityCheck = this.checkLocationProximity(
                coordinates,
                {latitude: destination.latitude, longitude: destination.longitude},
            );

            if (proximityCheck.isAtDestination) {
                // Deliver the parcel
                await this.deliverParcel(parcel, coordinates, address, driverId);
                affectedParcels.push({
                    id: parcel.id,
                    trackingNumber: parcel.trackingNumber,
                    status: ParcelStatus.DELIVERED,
                    action: 'delivered',
                });
            } else {
                // Update parcel location
                await this.updateParcelLocation(parcel, coordinates, address, driverId);
                affectedParcels.push({
                    id: parcel.id,
                    trackingNumber: parcel.trackingNumber,
                    status: ParcelStatus.IN_TRANSIT,
                    action: 'location_updated',
                });
            }
        }

        return {
            location: null, // Updated by caller
            affectedParcels,
        };
    }

    private async deliverParcel(parcel: any, coordinates: any, address: string, driverId: string) {
        // Update parcel status to DELIVERED
        await this.parcelsService.updateStatus(parcel.id, ParcelStatus.DELIVERED, address, {
            lat: coordinates.latitude,
            lng: coordinates.longitude,
        });

        // Create tracking event
        await this.parcelsService.createTrackingEvent({
            parcelId: parcel.id,
            type: TrackingEventType.DELIVERED,
            status: 'Delivered',
            location: address,
            coordinates: {lat: coordinates.latitude, lng: coordinates.longitude},
            description: `Parcel delivered to destination at ${address}.`,
            driverId,
            automated: true,
        });
        const deliveryTime = new Date().toLocaleString();

        // Send delivery notification
        if (parcel.receiver?.email) {
            await this.mailerService.sendDeliveryNotification(
                parcel.receiver.email,
                parcel.receiver.name || 'Recipient',
                parcel.trackingNumber,
                address,
            );
        }

        // Send delivery confirmation to sender
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

        this.logger.log(`Parcel ${parcel.trackingNumber} delivered by driver ${driverId}`);
    }

    async notifyParcelPickup(
        driverId: string,
        parcelId: string,
        pickupLocation?: string
    ): Promise<void> {
        // Add this log at the very beginning to confirm method is called
        this.logger.log(`notifyParcelPickup called with driverId: ${driverId}, parcelId: ${parcelId}`);

        try {
            // Add log before database query
            this.logger.log('Fetching parcel details from database...');

            // Get parcel details
            const parcel = await this.prisma.parcel.findUnique({
                where: {id: parcelId},
                include: {
                    sender: {select: {name: true, email: true, phone: true}},
                    pickupLocation: true,
                },
            });

            this.logger.log('Parcel query result:', {
                found: !!parcel,
                parcelId: parcel?.id,
                driverId: parcel?.driverId,
                senderEmail: parcel?.sender?.email
            });

            if (!parcel) {
                this.logger.error(`Parcel with ID ${parcelId} not found`);
                throw new NotFoundException(`Parcel with ID ${parcelId} not found`);
            }

            // Verify driver is assigned to this parcel
            this.logger.log(`Verifying driver assignment. Parcel driverId: ${parcel.driverId}, Request driverId: ${driverId}`);

            if (parcel.driverId !== driverId) {
                this.logger.error('Driver not assigned to this parcel', {
                    parcelDriverId: parcel.driverId,
                    requestDriverId: driverId
                });
                throw new BadRequestException('Driver not assigned to this parcel');
            }

            this.logger.log('Fetching driver details...');

            // Get driver details (drivers are Users with role DRIVER)
            const driver = await this.prisma.user.findUnique({
                where: {id: driverId},
                select: {name: true, phone: true},
            });

            this.logger.log('Driver details:', { found: !!driver, name: driver?.name });

            this.logger.log('Updating parcel status to PICKED_UP...');

            // Update parcel status to PICKED_UP
            await this.parcelsService.updateStatus(
                parcel.id,
                ParcelStatus.PICKED_UP,
                pickupLocation || parcel.pickupLocation.address
            );

            this.logger.log('Parcel status updated successfully');

            this.logger.log('Creating tracking event...');

            // Create tracking event
            await this.parcelsService.createTrackingEvent({
                parcelId: parcel.id,
                type: TrackingEventType.PICKED_UP,
                status: 'Picked Up',
                location: pickupLocation || parcel.pickupLocation.address,
                description: `Parcel picked up by driver ${driver?.name || 'Driver'}.`,
                driverId,
                automated: false,
            });

            this.logger.log('Tracking event created successfully');

            // Send pickup notification to sender
            if (parcel.sender?.email) {
                this.logger.log('Sender email found, preparing to send notification...');

                this.logger.log('Preparing to send pickup notification email', {
                    to: parcel.sender.email,
                    senderName: parcel.sender.name,
                    trackingNumber: parcel.trackingNumber,
                    pickupLocation: pickupLocation || parcel.pickupLocation.address,
                    driverName: driver?.name,
                    driverPhone: driver?.phone
                });

                this.logger.log('Calling mailerService.sendPickupNotification...');

                await this.mailerService.sendPickupNotification(
                    parcel.sender.email,
                    parcel.sender.name || 'Sender',
                    parcel.trackingNumber,
                    pickupLocation || parcel.pickupLocation.address,
                    driver?.name,
                    driver?.phone || undefined // Remove the duplicate || undefined
                );

                this.logger.log('Email sent successfully');
            } else {
                this.logger.warn('No sender email found, skipping email notification', {
                    senderId: parcel.sender?.name,
                    senderExists: !!parcel.sender
                });
            }

            this.logger.log(`Pickup notification process completed for parcel ${parcel.trackingNumber} by driver ${driverId}`);

        } catch (error) {
            this.logger.error(`Failed to send pickup notification for parcel ${parcelId}`, {
                error: error.message,
                stack: error.stack,
                driverId,
                parcelId
            });
            throw error;
        }
    }

    async notifyReceiverForPickup(
        driverId: string,
        parcelId: string,
        arrivalLocation?: string,
        pickupInstructions?: string
    ): Promise<void> {
        try {
            // Get parcel details
            const parcel = await this.prisma.parcel.findUnique({
                where: {id: parcelId},
                include: {
                    receiver: {select: {name: true, email: true, phone: true}},
                    destinationLocation: true,
                },
            });

            if (!parcel) {
                throw new NotFoundException(`Parcel with ID ${parcelId} not found`);
            }

            // Verify driver is assigned to this parcel
            if (parcel.driverId !== driverId) {
                throw new BadRequestException('Driver not assigned to this parcel');
            }

            // Get driver details (drivers are Users with role DRIVER)
            const driver = await this.prisma.user.findUnique({
                where: {id: driverId},
                select: {name: true, phone: true},
            });

            const location = arrivalLocation || parcel.destinationLocation.address;

            // Update parcel status to ARRIVED_AT_DESTINATION
            await this.parcelsService.updateStatus(
                parcel.id,
                ParcelStatus.ARRIVED_AT_DESTINATION, // You might need to add this status
                location
            );

            // Create tracking event
            await this.parcelsService.createTrackingEvent({
                parcelId: parcel.id,
                type: TrackingEventType.ARRIVED_AT_DESTINATION, // You might need to add this type
                status: 'Arrived at Destination',
                location,
                description: `Driver arrived at destination. Ready for pickup.`,
                driverId,
                automated: false,
            });

            // Send receiver pickup notification
            if (parcel.receiver?.email) {
                await this.mailerService.sendReceiverPickupNotification(
                    parcel.receiver.email,
                    parcel.receiver.name || 'Recipient',
                    parcel.trackingNumber,
                    location,
                    pickupInstructions,
                    driver?.name,
                    driver?.phone || undefined || undefined
                );
            } else {
                this.logger.warn(`Sender email not found. Skipping pickup email for parcel ${parcel.id}`);
            }

            this.logger.log(`Receiver pickup notification sent for parcel ${parcel.trackingNumber} by driver ${driverId}`);

        } catch (error) {
            this.logger.error(`Failed to send receiver pickup notification for parcel ${parcelId}`, error);
            throw error;
        }
    }

    private async updateParcelLocation(parcel: any, coordinates: any, address: string, driverId: string) {
        // Update parcel status to IN_TRANSIT
        await this.parcelsService.updateStatus(parcel.id, ParcelStatus.IN_TRANSIT, address, {
            lat: coordinates.latitude,
            lng: coordinates.longitude,
        });

        // Create tracking event
        await this.parcelsService.createTrackingEvent({
            parcelId: parcel.id,
            type: TrackingEventType.LOCATION_UPDATE,
            status: 'In Transit',
            location: address,
            coordinates: {lat: coordinates.latitude, lng: coordinates.longitude},
            description: `Driver location updated: ${address}.`,
            driverId,
            automated: true,
        });

        // Send location update notification (throttle to avoid spam)
        const shouldNotify = await this.shouldSendLocationNotification(parcel.id);
        if (shouldNotify && parcel.receiver?.email) {
            await this.mailerService.sendLocationUpdateNotification(
                parcel.receiver.email,
                parcel.receiver.name || 'Recipient',
                parcel.trackingNumber,
                address,
            );
        }
    }

    private checkLocationProximity(
        current: { latitude: number; longitude: number },
        destination: { latitude: number; longitude: number }
    ): LocationProximityCheck {
        const distance = this.calculateDistance(current, destination);
        const isAtDestination = distance <= this.DELIVERY_THRESHOLD_METERS;

        return {
            isAtDestination,
            distance,
            threshold: this.DELIVERY_THRESHOLD_METERS,
        };
    }

    private calculateDistance(
        point1: { latitude: number; longitude: number },
        point2: { latitude: number; longitude: number }
    ): number {
        // Earth's mean radius in meters
        const EARTH_RADIUS = 6371_000; // 6,371 km

        // Helper function to convert degrees to radians
        const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

        // Convert latitudes and longitudes to radians
        const lat1Rad = toRadians(point1.latitude);
        const lat2Rad = toRadians(point2.latitude);
        const latDiffRad = toRadians(point2.latitude - point1.latitude);
        const lonDiffRad = toRadians(point2.longitude - point1.longitude);

        // Haversine formula: calculate the great-circle distance
        const haversineSquare = Math.sin(latDiffRad / 2) * Math.sin(latDiffRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(lonDiffRad / 2) * Math.sin(lonDiffRad / 2);
        const angularDistance = 2 * Math.atan2(Math.sqrt(haversineSquare), Math.sqrt(1 - haversineSquare));

        // Return distance in meters
        return EARTH_RADIUS * angularDistance;
    }

    private async shouldSendLocationNotification(parcelId: string): Promise<boolean> {
        // Check if we sent a notification in the last 30 minutes
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const recentNotification = await this.prisma.trackingEvent.findFirst({
            where: {
                parcelId,
                type: TrackingEventType.LOCATION_UPDATE,
                createdAt: {gte: thirtyMinutesAgo},
            },
        });

        return !recentNotification;
    }

    private validateCoordinates(latitude: number, longitude: number): void {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new BadRequestException('Invalid coordinates');
        }
    }

    private transformToDriverLocationInterface(location: any): DriverLocationI {
        return {
            id: location.id,
            driverId: location.driverId,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            timestamp: location.timestamp.toISOString(),
        };
    }

    async confirmManualDelivery(
        driverId: string,
        parcelId: string,
        deliveryLocation?: string,
        deliveryNotes?: string
    ): Promise<void> {
        try {
            // Get parcel details
            const parcel = await this.prisma.parcel.findUnique({
                where: {id: parcelId},
                include: {
                    sender: {select: {name: true, email: true, phone: true}},
                    receiver: {select: {name: true, email: true, phone: true}},
                    destinationLocation: true,
                },
            });

            if (!parcel) {
                throw new NotFoundException(`Parcel with ID ${parcelId} not found`);
            }

            // Verify driver is assigned to this parcel
            if (parcel.driverId !== driverId) {
                throw new BadRequestException('Driver not assigned to this parcel');
            }

            const location = deliveryLocation || parcel.destinationLocation.address;

            // Get current driver location for coordinates
            const driverLocation = await this.getDriverCurrentLocation(driverId);
            const coordinates = driverLocation ?
                {lat: driverLocation.latitude, lng: driverLocation.longitude} :
                {lat: parcel.destinationLocation.latitude, lng: parcel.destinationLocation.longitude};

            // Manually deliver the parcel
            await this.deliverParcel(
                parcel,
                {latitude: coordinates.lat, longitude: coordinates.lng},
                location,
                driverId
            );

            // Add delivery notes if provided
            if (deliveryNotes) {
                await this.parcelsService.createTrackingEvent({
                    parcelId: parcel.id,
                    type: TrackingEventType.DELIVERED,
                    status: 'Delivery Note',
                    location,
                    description: deliveryNotes,
                    driverId,
                    automated: false,
                });
            }

            this.logger.log(`Manual delivery confirmed for parcel ${parcel.trackingNumber} by driver ${driverId}`);

        } catch (error) {
            this.logger.error(`Failed to confirm manual delivery for parcel ${parcelId}`, error);
            throw error;
        }
    }
}