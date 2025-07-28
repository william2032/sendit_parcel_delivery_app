import {Injectable, NotFoundException, BadRequestException, ForbiddenException} from '@nestjs/common';
import {
    AssignDriverDto,
    CoordinatesDto,
    CreateParcelDto,
    CreateTrackingEventDto,
    ParcelQueryDto,
    UpdateParcelDto,
    WeightCategory
} from './dtos';
import { PaginatedResponse, ParcelI, TrackingEventI } from './interfaces/parcel.interface';
import { PrismaService } from '../prisma/prisma.service';
import {
    Prisma,
    TrackingEventType,
    ParcelStatus,
    WeightCategory as PrismaWeightCategory
} from 'generated/prisma';
import {MailerService} from "../mailer/mailer.service";
import { Logger } from '@nestjs/common';
import {DriversService} from "../drivers/drivers.service";


interface ParcelInfo {
    trackingNumber: string;
    receiverName: string;
    senderName: string;
    estimatedDelivery: string;
}

@Injectable()
export class ParcelsService {
    private readonly logger = new Logger(ParcelsService.name);
    constructor(private prisma: PrismaService, private readonly mailerService: MailerService,private  driverService:DriversService) {}

    async create(createParcelDto: CreateParcelDto): Promise<ParcelI> {
        const parcel = await this.prisma.parcel.create({
            data: {
                ...createParcelDto,
                currency: createParcelDto.currency || 'KES',
            },
            include: {
                sender: true,
                receiver: true,
                driver: true,
                pickupLocation: true,
                destinationLocation: true,
                trackingEvents: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        // Create initial tracking event
        await this.createTrackingEvent({
            parcelId: parcel.id,
            type: TrackingEventType.ORDER_CREATED,
            status: 'Order Created',
            location: parcel.pickupLocation.address,
            coordinates: {
                lat: parcel.pickupLocation.latitude,
                lng: parcel.pickupLocation.longitude
            },
            description: 'Parcel order has been created and is awaiting driver assignment.',
            automated: true
        });

        return this.transformToParcelInterface(parcel);
    }

    async findAll(query: ParcelQueryDto): Promise<PaginatedResponse<ParcelI>> {
        const { page = 1, limit = 10, ...filters } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ParcelWhereInput = {
            isActive: true,
            ...(filters.senderId && { senderId: filters.senderId }),
            ...(filters.receiverId && { receiverId: filters.receiverId }),
            ...(filters.driverId && { driverId: filters.driverId }),
            ...(filters.status && { status: filters.status as ParcelStatus }),
            ...(filters.trackingNumber && {
                trackingNumber: {
                    contains: filters.trackingNumber,
                    mode: Prisma.QueryMode.insensitive
                }
            }),
        };

        const [parcels, total] = await Promise.all([
            this.prisma.parcel.findMany({
                where,
                include: {
                    sender: true,
                    receiver: true,
                    driver: true,
                    pickupLocation: true,
                    destinationLocation: true,
                    trackingEvents: {
                        orderBy: { createdAt: 'desc' }
                    }
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.parcel.count({ where })
        ]);

        return {
            data: parcels.map(parcel => this.transformToParcelInterface(parcel)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findOne(id: string): Promise<ParcelI> {
        const parcel = await this.prisma.parcel.findFirst({
            where: { id, isActive: true },
            include: {
                sender: true,
                receiver: true,
                driver: true,
                pickupLocation: true,
                destinationLocation: true,
                trackingEvents: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!parcel) {
            throw new NotFoundException(`Parcel with ID ${id} not found`);
        }

        return this.transformToParcelInterface(parcel);
    }

    async findByTrackingNumber(trackingNumber: string): Promise<ParcelI> {
        const parcel = await this.prisma.parcel.findFirst({
            where: { trackingNumber, isActive: true },
            include: {
                sender: true,
                receiver: true,
                driver: true,
                pickupLocation: true,
                destinationLocation: true,
                trackingEvents: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!parcel) {
            throw new NotFoundException(`Parcel with tracking number ${trackingNumber} not found`);
        }

        return this.transformToParcelInterface(parcel);
    }

    async update(id: string, updateParcelDto: UpdateParcelDto, user: { id: string; role: string }): Promise<ParcelI> {
        const existingParcel = await this.prisma.parcel.findFirst({
            where: { id, isActive: true },
            include: { sender: true, receiver: true, pickupLocation: true, destinationLocation: true },
        });

        if (!existingParcel) {
            throw new NotFoundException(`Parcel with ID ${id} not found`);
        }

        // Restrict status update to COMPLETED to admins only
        if (updateParcelDto.status === 'COMPLETED' && user.role !== 'ADMIN') {
            throw new ForbiddenException('Only admins can set status to COMPLETED');
        }

        // Calculate price based on weight category
        let quote: number | undefined;
        if (updateParcelDto.weightCategory) {
            const priceMap = {
                ULTRA_LIGHT: 10,
                LIGHT: 20,
                MEDIUM: 30,
                HEAVY: 50,
                EXTRA_HEAVY: 80,
                FREIGHT: 120,
            };
            quote = priceMap[updateParcelDto.weightCategory];
        }

        // Prepare update data for the parcel
        const updateData: Prisma.ParcelUpdateInput = {
            ...(updateParcelDto.receiverName && { receiverName: updateParcelDto.receiverName }),
            ...(updateParcelDto.receiverPhone && { receiverPhone: updateParcelDto.receiverPhone }),
            ...(updateParcelDto.receiverEmail && { receiverEmail: updateParcelDto.receiverEmail }),
            ...(updateParcelDto.senderPhone && { senderPhone: updateParcelDto.senderPhone }),
            ...(updateParcelDto.weight && { weight: updateParcelDto.weight }),
            ...(updateParcelDto.weightCategory && { weightCategory: updateParcelDto.weightCategory }),
            ...(quote !== undefined && { quote }),
            ...(updateParcelDto.estimatedDeliveryTime && {
                estimatedDeliveryTime: new Date(updateParcelDto.estimatedDeliveryTime),
            }),
            ...(updateParcelDto.status && { status: updateParcelDto.status }),
        };


        // Update or create pickup location
        if (updateParcelDto.pickupAddress) {
            updateData.pickupLocation = {
                update: { address: updateParcelDto.pickupAddress },
            };
        }

        // Update or create destination location
        if (updateParcelDto.destinationAddress) {
            updateData.destinationLocation = {
                update: { address: updateParcelDto.destinationAddress },
            };
        }

        const updatedParcel = await this.prisma.parcel.update({
            where: { id },
            data: updateData,
            include: {
                sender: true,
                receiver: true,
                driver: true,
                pickupLocation: true,
                destinationLocation: true,
                trackingEvents: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        return this.transformToParcelInterface(updatedParcel);
    }

    async assignDriver(id: string, assignDriverDto: AssignDriverDto): Promise<ParcelI> {
        const parcel = await this.findOne(id);

        if (parcel.driverId) {
            throw new BadRequestException('Driver already assigned to this parcel');
        }

        const updatedParcel = await this.prisma.parcel.update({
            where: { id },
            data: {
                driver: { connect: { id: assignDriverDto.driverId } },
                assignedAt: new Date(),
                pickupTime: assignDriverDto.pickupTime ? new Date(assignDriverDto.pickupTime) : undefined,
                status: ParcelStatus.ASSIGNED,
                estimatedDeliveryTime: assignDriverDto.estimatedDeliveryTime
                    ? new Date(assignDriverDto.estimatedDeliveryTime)
                    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Default to 3 days from now
            },
            include: {
                sender: {
                    select: { name: true }
                },
                receiver: {
                    select: { name: true }
                },
                driver: {
                    select: { email: true, name: true }
                },
                pickupLocation: true,
                destinationLocation: true,
                trackingEvents: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        // Create tracking event for driver assignment
        await this.createTrackingEvent({
            parcelId: id,
            type: TrackingEventType.DRIVER_ASSIGNED,
            status: 'Driver Assigned',
            location: parcel.pickupLocation.address,
            coordinates: {
                lat: parcel.pickupLocation.lat,
                lng: parcel.pickupLocation.lng
            },
            description: 'Driver has been assigned to pick up the parcel.',
            driverId: assignDriverDto.driverId,
            automated: true
        });

        // Prepare parcel info for notification
        const parcelInfo: ParcelInfo= {
            trackingNumber: updatedParcel.trackingNumber,
            receiverName: updatedParcel.receiverName || 'Unknown Receiver',
            senderName: updatedParcel.sender?.name || 'Unknown Sender',
            estimatedDelivery: updatedParcel.estimatedDeliveryTime?.toISOString() || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Send email notification to driver if email is available
        if (updatedParcel.driver?.email) {
            try {
                await this.mailerService.sendParcelAssignmentNotification(
                    updatedParcel.driver.email,
                    updatedParcel.driver.name || 'Driver',
                    parcelInfo
                );
                this.logger.log(`Parcel assignment notification sent to driver ${updatedParcel.driver.email}`);
            } catch (error) {
                this.logger.error(`Failed to send parcel assignment notification to ${updatedParcel.driver.email}`, error.stack);
            }
        } else {
            this.logger.warn(`Email notification skipped. Missing driver email.`, {
                driverEmailPresent: !!updatedParcel.driver?.email,
                receiverNamePresent: !!updatedParcel.receiver?.name,
                senderNamePresent: !!updatedParcel.sender?.name,
                estimatedDeliveryTimePresent: !!updatedParcel.estimatedDeliveryTime,
            });
        }

        return this.transformToParcelInterface(updatedParcel);
    }

    async updateStatus(id: string, status: ParcelStatus, location?: string, coordinates?: CoordinatesDto): Promise<ParcelI> {
        const parcel = await this.findOne(id);

        const updateData: Prisma.ParcelUpdateInput = {
            status: status
        };

        if (status === ParcelStatus.DELIVERED) {
            updateData.deliveredAt = new Date();
            updateData.actualDeliveryTime = new Date();
        }
        else if (status === ParcelStatus.COMPLETED) {
            updateData.completedAt = new Date();
        }
        if (status === ParcelStatus.PICKED_UP && parcel.status !== ParcelStatus.PICKED_UP) {
            try {
                if (parcel.driverId) {
                    // Call your notification method
                    await this.driverService.notifyParcelPickup(
                        parcel.driverId,
                        id,
                        location
                    );
                }
            } catch (error) {
                // Log error but don't fail the status update
                console.error('Failed to send pickup notification:', error);
            }
        }

        const updatedParcel = await this.prisma.parcel.update({
            where: { id },
            data: updateData,
            include: {
                sender: true,
                receiver: true,
                driver: true,
                pickupLocation: true,
                destinationLocation: true,
                trackingEvents: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        // Create tracking event for status update
        const trackingEventType = this.mapStatusToTrackingEventType(status);
        await this.createTrackingEvent({
            parcelId: id,
            type: trackingEventType,
            status: status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            location: location || parcel.pickupLocation.address,
            coordinates: coordinates || {
                lat: parcel.pickupLocation.lat,
                lng: parcel.pickupLocation.lng
            },
            description: `Parcel status updated to ${status.replace('_', ' ').toLowerCase()}.`,
            driverId: parcel.driverId,
            automated: true
        });

        return this.transformToParcelInterface(updatedParcel);
    }

    async remove(id: string): Promise<void> {
        const parcel = await this.prisma.parcel.findFirst({
            where: { id, isActive: true }
        });

        if (!parcel) {
            throw new NotFoundException(`Parcel with ID ${id} not found`);
        }

        await this.prisma.parcel.update({
            where: { id },
            data: {
                isActive: false,
                deletedAt: new Date()
            }
        });
    }

    async createTrackingEvent(createTrackingEventDto: CreateTrackingEventDto): Promise<TrackingEventI> {
        let locationId: string | undefined;

        if (createTrackingEventDto.coordinates) {
            const existingLocation = await this.prisma.location.findFirst({
                where: {
                    latitude: createTrackingEventDto.coordinates.lat,
                    longitude: createTrackingEventDto.coordinates.lng,
                    address: createTrackingEventDto.location
                }
            });

            if (existingLocation) {
                locationId = existingLocation.id;
            } else {
                const newLocation = await this.prisma.location.create({
                    data: {
                        name: createTrackingEventDto.location,
                        address: createTrackingEventDto.location,
                        latitude: createTrackingEventDto.coordinates.lat,
                        longitude: createTrackingEventDto.coordinates.lng
                    }
                });
                locationId = newLocation.id;
            }
        }

        const trackingEventData: Prisma.TrackingEventCreateInput = {
            parcel: { connect: { id: createTrackingEventDto.parcelId } },
            type: createTrackingEventDto.type,
            status: this.mapTrackingEventTypeToParcelStatus(createTrackingEventDto.type),
            description: createTrackingEventDto.description,
            notes: createTrackingEventDto.notes,
            automated: createTrackingEventDto.automated ?? false,
            ...(locationId && {
                location: { connect: { id: locationId } }
            }),
            ...(createTrackingEventDto.driverId && {
                updatedBy: createTrackingEventDto.driverId
            })
        };

        const trackingEvent = await this.prisma.trackingEvent.create({
            data: trackingEventData,
            include: {
                location: true
            }
        });

        return this.transformToTrackingEventInterface(trackingEvent);
    }

    async getTrackingEvents(parcelId: string): Promise<TrackingEventI[]> {
        const events = await this.prisma.trackingEvent.findMany({
            where: { parcelId },
            include: {
                location: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return events.map(event => this.transformToTrackingEventInterface(event));
    }

    private transformToParcelInterface(parcel: any): ParcelI {
        const latestTrackingEvent = parcel.trackingEvents?.[0];

        return {
            id: parcel.id,
            trackingNumber: parcel.trackingNumber,
            address: parcel.destinationLocation?.address || '',
            date: parcel.createdAt.toISOString(),
            status: parcel.status,
            createdAt: parcel.createdAt.toISOString(),

            pickupLocation: {
                lat: parcel.pickupLocation.latitude,
                lng: parcel.pickupLocation.longitude,
                name: parcel.pickupLocation.name,
                address: parcel.pickupLocation.address,
            },

            destination: {
                lat: parcel.destinationLocation.latitude,
                lng: parcel.destinationLocation.longitude,
                name: parcel.destinationLocation.name,
                address: parcel.destinationLocation.address,
            },

            currentLocation: latestTrackingEvent?.location?.latitude && latestTrackingEvent?.location?.longitude ? {
                lat: latestTrackingEvent.location.latitude,
                lng: latestTrackingEvent.location.longitude,
                address: latestTrackingEvent.location.address
            } : undefined,

            senderId: parcel.senderId,
            sender: parcel.sender ? {
                id: parcel.sender.id,
                name: parcel.sender.name,
                email: parcel.sender.email,
                phone: parcel.sender.phone,
                role: parcel.sender.role,
                isActive: parcel.sender.isActive ?? true,
                deletedAt: parcel.sender.deletedAt?.toISOString() || null,
            } : undefined,
            senderName: parcel.sender?.name || '',
            senderPhone: parcel.senderPhone || parcel.sender?.phone || '',
            senderEmail: parcel.sender?.email || '',

            receiverId: parcel.receiverId,
            receiver: parcel.receiver ? {
                id: parcel.receiver.id,
                name: parcel.receiver.name,
                email: parcel.receiver.email,
                phone: parcel.receiver.phone,
                role: parcel.receiver.role,
                isActive: parcel.receiver.isActive ?? true,
                deletedAt: parcel.receiver.deletedAt?.toISOString() || null,
            } : undefined,
            receiverName: parcel.receiverName,
            receiverPhone: parcel.receiverPhone || '',
            receiverEmail: parcel.receiverEmail,

            driverId: parcel.driverId,
            driver: parcel.driver ? {
                id: parcel.driver.id,
                name: parcel.driver.name,
                email: parcel.driver.email,
                phone: parcel.driver.phone,
                role: parcel.driver.role,
                isActive: parcel.driver.isActive ?? true,
                deletedAt: parcel.driver.deletedAt?.toISOString() || null,
            } : undefined,

            deliveryTime: parcel.deliveredAt?.toISOString() || '',
            estimatedDeliveryDate: parcel.estimatedDeliveryTime?.toISOString() || '',
            trackingEvents: parcel.trackingEvents?.map(event => this.transformToTrackingEventInterface(event)) || [],
            price: parcel.quote,

            notificationsSent: {
                customerPickup: false,
                customerDelivery: false,
                recipientDelivery: false,
                driverAssignment: !!parcel.driverId
            },

            weight: parcel.weight,
            weightCategory: parcel.weightCategory as WeightCategory
        };
    }

    private transformToTrackingEventInterface(event: any): TrackingEventI {
        return {
            id: event.id,
            parcelId: event.parcelId,
            type: event.type,
            status: this.getStatusFromEventType(event.type),
            location: event.location?.address || 'Unknown Location',
            coordinates: event.location ? {
                lat: event.location.latitude,
                lng: event.location.longitude
            } : undefined,
            timestamp: event.createdAt.toISOString(),
            description: event.description,
            notes: event.notes,
            driverId: event.updatedBy,
            automated: event.automated
        };
    }

    private getStatusFromEventType(eventType: TrackingEventType): string {
        const statusMapping = {
            [TrackingEventType.ORDER_CREATED]: 'Order Created',
            [TrackingEventType.DRIVER_ASSIGNED]: 'Driver Assigned',
            [TrackingEventType.PICKED_UP]: 'Picked Up',
            [TrackingEventType.LOCATION_UPDATE]: 'Location Update',
            [TrackingEventType.OUT_FOR_DELIVERY]: 'Out for Delivery',
            [TrackingEventType.DELIVERED]: 'Delivered',
            [TrackingEventType.COMPLETED]: 'Completed',
            [TrackingEventType.CANCELLED]: 'Cancelled',
            [TrackingEventType.EXCEPTION]: 'Exception'
        };

        return statusMapping[eventType] || 'Unknown Status';
    }

    private mapStatusToTrackingEventType(status: ParcelStatus): TrackingEventType {
        const mapping = {
            [ParcelStatus.PENDING]: TrackingEventType.ORDER_CREATED,
            [ParcelStatus.ASSIGNED]: TrackingEventType.DRIVER_ASSIGNED,
            [ParcelStatus.PICKED_UP]: TrackingEventType.PICKED_UP,
            [ParcelStatus.IN_TRANSIT]: TrackingEventType.LOCATION_UPDATE,
            [ParcelStatus.OUT_FOR_DELIVERY]: TrackingEventType.OUT_FOR_DELIVERY,
            [ParcelStatus.DELIVERED]: TrackingEventType.DELIVERED,
            [ParcelStatus.COMPLETED]: TrackingEventType.COMPLETED,
            [ParcelStatus.CANCELLED]: TrackingEventType.CANCELLED,
        };

        return mapping[status] || TrackingEventType.LOCATION_UPDATE;
    }

    private mapTrackingEventTypeToParcelStatus(eventType: TrackingEventType): ParcelStatus {
        const mapping = {
            [TrackingEventType.ORDER_CREATED]: ParcelStatus.PENDING,
            [TrackingEventType.DRIVER_ASSIGNED]: ParcelStatus.ASSIGNED,
            [TrackingEventType.PICKED_UP]: ParcelStatus.PICKED_UP,
            [TrackingEventType.LOCATION_UPDATE]: ParcelStatus.IN_TRANSIT,
            [TrackingEventType.OUT_FOR_DELIVERY]: ParcelStatus.OUT_FOR_DELIVERY,
            [TrackingEventType.DELIVERED]: ParcelStatus.DELIVERED,
            [TrackingEventType.COMPLETED]: ParcelStatus.COMPLETED,
            [TrackingEventType.CANCELLED]: ParcelStatus.CANCELLED,
            [TrackingEventType.EXCEPTION]: ParcelStatus.IN_TRANSIT,
        };

        return mapping[eventType] || ParcelStatus.IN_TRANSIT;
    }
}