import {Injectable, NotFoundException, BadRequestException, ForbiddenException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {ParcelsService} from '../parcels/parcels.service';
import {UsersService} from '../users/users.service';
import {
    AdminCreateParcelDto,
    SenderSearchDto,
    DriverSearchDto,
    BulkDriverAssignmentDto,
    AdminParcelQueryDto,
    UpdateParcelStatusDto
} from './dtos/admin.dto';
import {
    SenderSearchResult,
    AvailableDriver,
    AdminParcelResponse,
    AdminDashboardStats,
    LocationCreateDto
} from './interfaces/admin.interface';
import {Prisma, ParcelStatus, TrackingEventType, UserRole} from 'generated/prisma';
import {PaginatedResponse} from '../parcels/interfaces/parcel.interface';
import {CoordinatesDto, WeightCategory} from "../parcels/dtos";

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private parcelsService: ParcelsService,
        private usersService: UsersService
    ) {
    }

    // Search for senders by name or email
    async searchSenders(searchDto: SenderSearchDto): Promise<SenderSearchResult[]> {
        const {query, limit = 10} = searchDto;

        const users = await this.prisma.user.findMany({
            where: {
                AND: [
                    {deletedAt: null},
                    {isActive: true},
                    {
                        OR: [
                            {name: {contains: query, mode: Prisma.QueryMode.insensitive}},
                            {email: {contains: query, mode: Prisma.QueryMode.insensitive}},
                            {phone: {contains: query, mode: Prisma.QueryMode.insensitive}}
                        ]
                    }
                ]
            },
            include: {
                sentParcels: {
                    where: {isActive: true},
                    orderBy: {createdAt: 'desc'},
                    take: 3,
                    include: {
                        destinationLocation: true
                    }
                },
                _count: {
                    select: {
                        sentParcels: {
                            where: {isActive: true}
                        }
                    }
                }
            },
            take: limit,
            orderBy: [
                {name: 'asc'}
            ]
        });

        return users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            city: user.city || undefined,
            country: user.country || undefined,
            totalParcels: user._count.sentParcels,
            recentParcels: user.sentParcels.map(parcel => ({
                id: parcel.id,
                trackingNumber: parcel.trackingNumber,
                status: parcel.status,
                createdAt: parcel.createdAt.toISOString(),
                destination: parcel.destinationLocation.address
            }))
        }));
    }

    // Get sender details by ID
    async getSenderDetails(senderId: string): Promise<SenderSearchResult> {
        const user = await this.prisma.user.findFirst({
            where: {id: senderId, deletedAt: null, isActive: true},
            include: {
                sentParcels: {
                    where: {isActive: true},
                    orderBy: {createdAt: 'desc'},
                    take: 5,
                    include: {
                        destinationLocation: true
                    }
                },
                _count: {
                    select: {
                        sentParcels: {
                            where: {isActive: true}
                        }
                    }
                }
            }
        });

        if (!user) {
            throw new NotFoundException(`Sender with ID ${senderId} not found`);
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            city: user.city || undefined,
            country: user.country || undefined,
            totalParcels: user._count.sentParcels,
            recentParcels: user.sentParcels.map(parcel => ({
                id: parcel.id,
                trackingNumber: parcel.trackingNumber,
                status: parcel.status,
                createdAt: parcel.createdAt.toISOString(),
                destination: parcel.destinationLocation.address
            }))
        };
    }

    // Get single parcel by ID with admin view
    async getParcelById(parcelId: string): Promise<AdminParcelResponse> {
        const parcel = await this.prisma.parcel.findUnique({
            where: {
                id: parcelId,
                isActive: true
            },
            include: {
                sender: true,
                receiver: true,
                driver: true,
                pickupLocation: true,
                destinationLocation: true,
                trackingEvents: {
                    orderBy: {createdAt: 'desc'}
                }
            }
        });

        if (!parcel) {
            throw new NotFoundException(`Parcel with ID ${parcelId} not found`);
        }

        const senderDetails = await this.getSenderDetails(parcel.senderId);
        return this.transformToAdminParcelResponse(parcel, senderDetails);
    }

    // Search for available drivers
    async searchAvailableDrivers(searchDto: DriverSearchDto): Promise<AvailableDriver[]> {
        const {
            city,
            lat,
            lng,
            maxAssignedParcels = 5
        } = searchDto;

        const whereConditions: Prisma.UserWhereInput = {
            role: UserRole.DRIVER,
            deletedAt: null,
            isActive: true,
        };

        // Add location-based filtering if coordinates provided
        if (lat && lng) {
            // Note: This is a simplified distance calculation
            whereConditions.city = city;
        } else if (city) {
            whereConditions.city = {
                contains: city,
                mode: Prisma.QueryMode.insensitive
            };
        }

        const drivers = await this.prisma.user.findMany({
            where: whereConditions,
            include: {
                assignedParcels: {
                    where: {
                        status: {
                            in: [ParcelStatus.ASSIGNED, ParcelStatus.PICKED_UP, ParcelStatus.IN_TRANSIT, ParcelStatus.OUT_FOR_DELIVERY]
                        },
                        isActive: true
                    }
                },
                locationUpdates: {
                    orderBy: {timestamp: 'desc'},
                    take: 1
                },
                _count: {
                    select: {
                        assignedParcels: {
                            where: {
                                status: {
                                    in: [ParcelStatus.ASSIGNED, ParcelStatus.PICKED_UP, ParcelStatus.IN_TRANSIT, ParcelStatus.OUT_FOR_DELIVERY]
                                },
                                isActive: true
                            }
                        }
                    }
                }
            }
        });

        // Filter by assigned parcels count
        const availableDrivers = drivers.filter(driver =>
            driver._count.assignedParcels < maxAssignedParcels
        );

        return availableDrivers.map(driver => {
            const latestLocation = driver.locationUpdates[0];
            return {
                id: driver.id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone || '',
                currentLocation: latestLocation ? {
                    lat: latestLocation.latitude,
                    lng: latestLocation.longitude,
                    address: latestLocation.address || 'Unknown Location'
                } : undefined,
                assignedParcels: driver._count.assignedParcels,
                lastSeen: driver.updatedAt.toISOString()
            };
        });
    }

    // Create parcel as admin
    async createParcel(adminId: string, createParcelDto: AdminCreateParcelDto): Promise<AdminParcelResponse> {
        // Verify admin permissions
        const admin = await this.usersService.findOne(adminId);
        if (admin.role !== UserRole.ADMIN && admin.role !== UserRole.CUSTOMER) {
            throw new ForbiddenException('Only admins can create parcels on behalf of users');
        }

        // Verify sender exists
        const sender = await this.getSenderDetails(createParcelDto.senderId);

        // Create or find locations
        const pickupLocation = await this.createOrFindLocation(createParcelDto.pickupLocation);
        const destinationLocation = await this.createOrFindLocation(createParcelDto.destinationLocation);

        // Create the parcel using existing parcels service
        const parcelData = {
            senderId: createParcelDto.senderId,
            senderPhone: createParcelDto.senderPhone,
            receiverName: createParcelDto.receiverName,
            receiverPhone: createParcelDto.receiverPhone,
            receiverEmail: createParcelDto.receiverEmail,
            weight: createParcelDto.weight,
            weightCategory: createParcelDto.weightCategory as WeightCategory,
            description: createParcelDto.description,
            pickupLocationId: pickupLocation.id,
            destinationLocationId: destinationLocation.id,
            quote: createParcelDto.quote,
            currency: createParcelDto.currency || 'KES',
            estimatedDeliveryTime: createParcelDto.estimatedDeliveryTime
        };

        const parcel = await this.parcelsService.create(parcelData);

        // Assign driver if provided
        if (createParcelDto.driverId) {
            await this.parcelsService.assignDriver(parcel.id, {
                driverId: createParcelDto.driverId,
                pickupTime: createParcelDto.pickupTime
            });
        }

        // Add tracking event for admin creation
        await this.parcelsService.createTrackingEvent({
            parcelId: parcel.id,
            type: TrackingEventType.ORDER_CREATED,
            status: ParcelStatus.PENDING,
            location: pickupLocation.address,
            coordinates: {
                lat: pickupLocation.latitude,
                lng: pickupLocation.longitude
            },
            description: `Parcel order created by admin ${admin.name}`,
            automated: false
        });

        return this.transformToAdminParcelResponse(parcel, sender);
    }

    // Get admin dashboard statistics
    async getDashboardStats(): Promise<AdminDashboardStats> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            totalParcels,
            pendingParcels,
            inTransitParcels,
            deliveredToday,
            totalRevenue,
            activeDrivers,
            recentOrders
        ] = await Promise.all([
            this.prisma.parcel.count({where: {isActive: true}}),
            this.prisma.parcel.count({where: {status: ParcelStatus.PENDING, isActive: true}}),
            this.prisma.parcel.count({
                where: {
                    status: {in: [ParcelStatus.IN_TRANSIT, ParcelStatus.OUT_FOR_DELIVERY]},
                    isActive: true
                }
            }),
            this.prisma.parcel.count({
                where: {
                    status: ParcelStatus.DELIVERED,
                    deliveredAt: {gte: today, lt: tomorrow},
                    isActive: true
                }
            }),
            this.prisma.parcel.aggregate({
                where: {isActive: true, status: ParcelStatus.DELIVERED}, // Assuming DELIVERED is the completed status
                _sum: {quote: true}
            }),
            this.prisma.user.count({
                where: {
                    role: UserRole.DRIVER,
                    isActive: true,
                    deletedAt: null
                }
            }),
            this.getAllParcels({page: 1, limit: 5})
        ]);

        return {
            totalParcels,
            pendingParcels,
            inTransitParcels,
            deliveredToday,
            totalRevenue: totalRevenue._sum.quote || 0,
            activeDrivers,
            recentOrders: recentOrders.data
        };
    }

    // Get all parcels with admin view
    async getAllParcels(query: AdminParcelQueryDto): Promise<PaginatedResponse<AdminParcelResponse>> {
        const {page = 1, limit = 20, ...filters} = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ParcelWhereInput = {
            isActive: true,
            ...(filters.status && {status: filters.status as ParcelStatus}),
            ...(filters.driverId && {driverId: filters.driverId}),
            ...(filters.senderId && {senderId: filters.senderId}),
            ...(filters.trackingNumber && {
                trackingNumber: {
                    contains: filters.trackingNumber,
                    mode: Prisma.QueryMode.insensitive
                }
            }),
            ...(filters.dateFrom && filters.dateTo && {
                createdAt: {
                    gte: new Date(filters.dateFrom),
                    lte: new Date(filters.dateTo)
                }
            })
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
                        orderBy: {createdAt: 'desc'}
                    }
                },
                skip,
                take: limit,
                orderBy: {createdAt: 'desc'}
            }),
            this.prisma.parcel.count({where})
        ]);

        const transformedParcels = await Promise.all(
            parcels.map(async (parcel) => {
                const senderDetails = await this.getSenderDetails(parcel.senderId);
                return this.transformToAdminParcelResponse(parcel, senderDetails);
            })
        );

        return {
            data: transformedParcels,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    // Bulk assign driver to multiple parcels
    async bulkAssignDriver(assignmentDto: BulkDriverAssignmentDto): Promise<AdminParcelResponse[]> {
        const {parcelIds, driverId, pickupTime, notes} = assignmentDto;

        // Verify driver exists and is available
        const availableDrivers = await this.searchAvailableDrivers({});
        const driver = availableDrivers.find(d => d.id === driverId);

        if (!driver) {
            throw new NotFoundException(`Driver with ID ${driverId} not found or not available`);
        }

        const results: AdminParcelResponse[] = [];

        for (const parcelId of parcelIds) {
            try {
                const updatedParcel = await this.parcelsService.assignDriver(parcelId, {
                    driverId,
                    pickupTime
                });

                // Add admin notes if provided
                if (notes) {
                    await this.parcelsService.createTrackingEvent({
                        parcelId,
                        type: TrackingEventType.DRIVER_ASSIGNED,
                        status: ParcelStatus.ASSIGNED,
                        location: updatedParcel.pickupLocation.address,
                        coordinates: {
                            lat: updatedParcel.pickupLocation.lat,
                            lng: updatedParcel.pickupLocation.lng
                        },
                        description: notes,
                        driverId,
                        automated: false
                    });
                }

                const senderDetails = await this.getSenderDetails(updatedParcel.senderId);
                results.push(this.transformToAdminParcelResponse(updatedParcel, senderDetails));
            } catch (error) {
                console.error(`Failed to assign driver to parcel ${parcelId}:`, error);
                // Continue with other parcels
            }
        }

        return results;
    }

    // Update parcel status with admin privileges
    async updateParcelStatus(
        parcelId: string,
        updateStatusDto: UpdateParcelStatusDto,
        adminId: string
    ): Promise<AdminParcelResponse> {
        const {status, currentLocation} = updateStatusDto;

        let coordinates: CoordinatesDto | undefined;
        if (currentLocation) {
            coordinates = {
                lat: currentLocation.lat,
                lng: currentLocation.lng
            };
        }

        const updatedParcel = await this.parcelsService.updateStatus(
            parcelId,
            status as ParcelStatus,
            currentLocation?.address,
            coordinates
        );

        // Add admin tracking event
        const parcel = await this.prisma.parcel.findUnique({
            where: {id: parcelId},
            include: {pickupLocation: true}
        });

        if (parcel) {
            await this.parcelsService.createTrackingEvent({
                parcelId,
                type: TrackingEventType.LOCATION_UPDATE,
                status: status as ParcelStatus,
                location: currentLocation?.address || parcel.pickupLocation.address,
                coordinates: coordinates || {
                    lat: parcel.pickupLocation.latitude,
                    lng: parcel.pickupLocation.longitude
                },
                description: `Status updated by admin`,
                automated: false
            });
        }

        const senderDetails = await this.getSenderDetails(updatedParcel.senderId);
        return this.transformToAdminParcelResponse(updatedParcel, senderDetails);
    }

    // Helper methods
    private async createOrFindLocation(locationDto: LocationCreateDto) {
        // Check if location already exists
        const existingLocation = await this.prisma.location.findFirst({
            where: {
                latitude: locationDto.lat,
                longitude: locationDto.lng,
                address: locationDto.address
            }
        });

        if (existingLocation) {
            return existingLocation;
        }

        // Create new location
        return this.prisma.location.create({
            data: {
                name: locationDto.name,
                address: locationDto.address,
                latitude: locationDto.lat,
                longitude: locationDto.lng
            }
        });
    }

    private transformToAdminParcelResponse(parcel: any, senderDetails: SenderSearchResult): AdminParcelResponse {
        return {
            ...parcel,
            senderDetails: {
                id: senderDetails.id,
                name: senderDetails.name,
                email: senderDetails.email,
                phone: senderDetails.phone,
                totalOrders: senderDetails.totalParcels
            },
            driverDetails: parcel.driver ? {
                id: parcel.driver.id,
                name: parcel.driver.name,
                email: parcel.driver.email,
                phone: parcel.driver.phone,
            } : undefined
        };
    }
}