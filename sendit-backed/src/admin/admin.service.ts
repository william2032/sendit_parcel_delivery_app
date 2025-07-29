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
    LocationCreateDto,
    RecentParcel
} from './interfaces/admin.interface';
import {Prisma, ParcelStatus, TrackingEventType, UserRole} from 'generated/prisma';
import {PaginatedResponse, ParcelI} from '../parcels/interfaces/parcel.interface';
import {CoordinatesDto, ParcelQueryDto,  WeightCategory} from "../parcels/dtos";

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private parcelsService: ParcelsService,
        private usersService: UsersService
    ) {
    }

    // Search for senders by name or email, including active
    async searchSenders(searchDto: SenderSearchDto): Promise<SenderSearchResult[]> {
        const {query, limit = 10} = searchDto;

        const users = await this.prisma.user.findMany({
            where: {
                isActive: true, // Only fetch active users
                OR: [
                    {name: {contains: query, mode: Prisma.QueryMode.insensitive}},
                    {email: {contains: query, mode: Prisma.QueryMode.insensitive}},
                    {phone: {contains: query, mode: Prisma.QueryMode.insensitive}}
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
            orderBy: [{name: 'asc'}]
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
                destination: parcel.destinationLocation?.address || 'Unknown'
            })),
            isActive: user.isActive, // Added to indicate user status
            deletedAt: user.deletedAt ? user.deletedAt.toISOString() : undefined // Added to indicate deletion status
        }));
    }


    async createParcel(adminId: string, createParcelDto: AdminCreateParcelDto): Promise<AdminParcelResponse> {
        const admin = await this.usersService.findOne(adminId);
        if (admin.role !== UserRole.ADMIN && admin.role !== UserRole.CUSTOMER) {
            throw new ForbiddenException('Only admins can create parcels on behalf of users');
        }

        const sender = await this.getSenderDetails(createParcelDto.senderId);

        const pickupLocation = await this.createOrFindLocation(createParcelDto.pickupLocation);
        const destinationLocation = await this.createOrFindLocation(createParcelDto.destinationLocation);

        const parcelData = {
            senderId: createParcelDto.senderId,
            senderPhone: createParcelDto.senderPhone,
            receiverId: createParcelDto.receiverId,
            receiverName: createParcelDto.receiverName,
            receiverPhone: createParcelDto.receiverPhone,
            receiverEmail: createParcelDto.receiverEmail,
            weight: createParcelDto.weight,
            weightCategory: createParcelDto.weightCategory as 'ULTRA_LIGHT' | 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'EXTRA_HEAVY' | 'FREIGHT',
            description: createParcelDto.description,
            pickupLocationId: pickupLocation.id,
            destinationLocationId: destinationLocation.id,
            quote: createParcelDto.quote,
            currency: createParcelDto.currency || 'KES',
            estimatedDeliveryTime: createParcelDto.estimatedDeliveryTime
        };

        const parcel = await this.parcelsService.create(parcelData);
        // If driver is specified, assign after creation
        if (createParcelDto.driverId) {
            await this.parcelsService.assignDriver(parcel.id, {
                driverId: createParcelDto.driverId,
                pickupTime: createParcelDto.pickupTime
            });
        }


        return this.transformToAdminParcelResponse(parcel, sender);
    }

    // Search for receivers by name, email, or phone, only fetching active users
    async searchReceivers(searchDto: SenderSearchDto): Promise<SenderSearchResult[]> {
        const {query, limit = 10} = searchDto;

        const users = await this.prisma.user.findMany({
            where: {
                isActive: true, // Only fetch active users
                OR: [
                    {name: {contains: query, mode: Prisma.QueryMode.insensitive}},
                    {email: {contains: query, mode: Prisma.QueryMode.insensitive}},
                    {phone: {contains: query, mode: Prisma.QueryMode.insensitive}}
                ]
            },
            include: {
                receivedParcels: { // Changed from sentParcels to receivedParcels
                    where: {isActive: true},
                    orderBy: {createdAt: 'desc'},
                    take: 3,
                    include: {
                        destinationLocation: true
                    }
                },
                _count: {
                    select: {
                        receivedParcels: { // Changed from sentParcels to receivedParcels
                            where: {isActive: true}
                        }
                    }
                }
            },
            take: limit,
            orderBy: [{name: 'asc'}]
        });

        return users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            city: user.city || undefined,
            country: user.country || undefined,
            totalParcels: user._count.receivedParcels, // Changed to receivedParcels
            recentParcels: user.receivedParcels.map(parcel => ({ // Changed to receivedParcels
                id: parcel.id,
                trackingNumber: parcel.trackingNumber,
                status: parcel.status,
                createdAt: parcel.createdAt.toISOString(),
                destination: parcel.destinationLocation?.address || 'Unknown'
            })),
            isActive: user.isActive,
            deletedAt: user.deletedAt ? user.deletedAt.toISOString() : undefined
        }));
    }

    // Get sender details by ID, including active and inactive users
    async getSenderDetails(senderId: string): Promise<SenderSearchResult> {
        try {
            // Add validation for senderId
            if (!senderId) {
                console.error('Invalid senderId provided:', senderId);
                throw new BadRequestException('Invalid senderId provided');
            }

            const user = await this.prisma.user.findFirst({
                where: {id: senderId},
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
                console.error(`Sender with ID ${senderId} not found`);
                throw new NotFoundException(`Sender with ID ${senderId} not found`);
            }

            return {
                id: user.id,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                city: user.city || undefined,
                country: user.country || undefined,
                totalParcels: user._count?.sentParcels || 0,
                recentParcels: user.sentParcels?.map(parcel => ({
                    id: parcel.id,
                    trackingNumber: parcel.trackingNumber,
                    status: parcel.status,
                    createdAt: parcel.createdAt.toISOString(),
                    destination: parcel.destinationLocation?.address || 'Unknown'
                })) || [],
                isActive: user.isActive,
                deletedAt: user.deletedAt ? user.deletedAt.toISOString() : undefined
            };
        } catch (error) {
            console.error(`Error fetching sender details for ID ${senderId}:`, error);
            throw error;
        }
    }

    // Search for available drivers, including active and inactive drivers
    async searchAvailableDrivers(searchDto: DriverSearchDto): Promise<AvailableDriver[]> {
        const {
            city,
            lat,
            lng,
            maxAssignedParcels = 5
        } = searchDto;

        const whereConditions: Prisma.UserWhereInput = {
            role: UserRole.DRIVER
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
                lastSeen: driver.updatedAt.toISOString(),
                isActive: driver.isActive, // Added to indicate driver status
                deletedAt: driver.deletedAt ? driver.deletedAt.toISOString() : undefined // Added to indicate deletion status
            };
        });
    }

    // Other methods remain unchanged unless you want to include deleted/inactive users in related queries
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
            activeUsers,
            recentOrdersRaw
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
                where: {isActive: true, status: ParcelStatus.COMPLETED},
                _sum: {quote: true}
            }),
            this.prisma.user.count({
                where: {
                    role: UserRole.DRIVER,
                    isActive: true,
                    deletedAt: null
                }
            }),
            this.prisma.user.count({
                where: {
                    isActive: true,
                    deletedAt: null
                }
            }),

            this.parcelsService.findAll({
                page: 1,
                limit: 5,
                status: undefined,
                senderId: undefined,
                receiverId: undefined,
                driverId: undefined,
                trackingNumber: undefined,
            }),
        ]);
        // console.log('recentOrdersResult:', JSON.stringify(recentOrdersRaw.data, null, 2));
        const recentOrders = await Promise.all(
            recentOrdersRaw.data
                .filter((parcel: ParcelI) => {
                    if (!parcel || !parcel.senderId || !parcel.sender?.id) {
                        console.warn(`Invalid parcel detected: ${JSON.stringify(parcel, null, 2)}`);
                        return false;
                    }
                    return true;
                })
                .map(async (parcel) => {
                    try {
                        const senderDetails = await this.getSenderDetails(parcel.senderId);
                        return this.transformToAdminParcelResponse(parcel, senderDetails);
                    } catch (error) {
                        console.error(`Error processing parcel ${parcel.id}:`, error);
                        return null; // Skip invalid parcels
                    }
                })
        );

        // Filter out any null results from failed transformations
        const validRecentOrders = recentOrders.filter((order): order is AdminParcelResponse => order !== null);

        return {
            totalParcels,
            pendingParcels,
            inTransitParcels,
            deliveredToday,
            totalRevenue: totalRevenue._sum.quote || 0,
            activeDrivers,
            activeUsers,
            recentOrders: validRecentOrders
        };
    }

    async getAllParcels(query: AdminParcelQueryDto): Promise<PaginatedResponse<AdminParcelResponse>> {
        const {page = 1, limit = 20, ...filters} = query;
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

        return this.fetchAndTransformParcels(where, page, limit);
    }

    async getUnassignedParcels(query: AdminParcelQueryDto): Promise<PaginatedResponse<AdminParcelResponse>> {
        const {page = 1, limit = 20, ...filters} = query;
        const where: Prisma.ParcelWhereInput = {
            isActive: true,
            driverId: null,
            status: {
                in: [ParcelStatus.PENDING, ParcelStatus.ASSIGNED]
            },
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

        return this.fetchAndTransformParcels(where, page, limit);
    }

    async assignDriverToParcel(
        parcelId: string,
        assignmentDto: { driverId: string; pickupTime?: string; notes?: string },
        adminId: string
    ): Promise<AdminParcelResponse> {
        const parcel = await this.getParcelById(parcelId);

        if (parcel.driverId) {
            throw new BadRequestException(`Parcel ${parcelId} already has a driver assigned`);
        }

        const availableDrivers = await this.searchAvailableDrivers({});
        const driver = availableDrivers.find(d => d.id === assignmentDto.driverId);

        if (!driver) {
            throw new NotFoundException(`Driver with ID ${assignmentDto.driverId} not found or not available`);
        }

        const updatedParcel = await this.parcelsService.assignDriver(parcelId, {
            driverId: assignmentDto.driverId,
            pickupTime: assignmentDto.pickupTime
        });

        if (assignmentDto.notes) {
            await this.parcelsService.createTrackingEvent({
                parcelId,
                type: TrackingEventType.DRIVER_ASSIGNED,
                status: ParcelStatus.ASSIGNED,
                location: updatedParcel.pickupLocation.address,
                coordinates: {
                    lat: updatedParcel.pickupLocation.lat,
                    lng: updatedParcel.pickupLocation.lng
                },
                description: `Driver assigned by admin. Notes: ${assignmentDto.notes}`,
                driverId: assignmentDto.driverId,
                automated: false
            });
        }

        const senderDetails = await this.getSenderDetails(updatedParcel.senderId);
        return this.transformToAdminParcelResponse(updatedParcel, senderDetails);
    }

    async getUnassignedParcelsStats(): Promise<{
        total: number;
        pending: number;
        byCity: Array<{ city: string; count: number }>;
        oldestUnassigned: Date | null;
    }> {
        const [
            totalUnassigned,
            pendingUnassigned,
            parcelsByCity,
            oldestParcel
        ] = await Promise.all([
            this.prisma.parcel.count({
                where: {
                    isActive: true,
                    driverId: null,
                    status: {
                        in: [ParcelStatus.PENDING, ParcelStatus.ASSIGNED]
                    }
                }
            }),
            this.prisma.parcel.count({
                where: {
                    isActive: true,
                    driverId: null,
                    status: ParcelStatus.PENDING
                }
            }),
            this.prisma.parcel.groupBy({
                by: ['pickupLocationId'],
                where: {
                    isActive: true,
                    driverId: null,
                    status: {
                        in: [ParcelStatus.PENDING, ParcelStatus.ASSIGNED]
                    }
                },
                _count: {
                    id: true
                }
            }),
            this.prisma.parcel.findFirst({
                where: {
                    isActive: true,
                    driverId: null,
                    status: {
                        in: [ParcelStatus.PENDING, ParcelStatus.ASSIGNED]
                    }
                },
                orderBy: {
                    createdAt: 'asc'
                },
                select: {
                    createdAt: true
                }
            })
        ]);

        const cityStats = await Promise.all(
            parcelsByCity.map(async (item) => {
                const location = await this.prisma.location.findUnique({
                    where: {id: item.pickupLocationId},
                    select: {address: true}
                });

                const cityMatch = location?.address.match(/,\s*([^,]+)(?=,|$)/);
                const city = cityMatch ? cityMatch[1].trim() : 'Unknown';

                return {
                    city,
                    count: item._count.id
                };
            })
        );

        const cityCountMap = cityStats.reduce((acc, item) => {
            acc[item.city] = (acc[item.city] || 0) + item.count;
            return acc;
        }, {} as Record<string, number>);

        const byCity = Object.entries(cityCountMap).map(([city, count]) => ({
            city,
            count
        }));

        return {
            total: totalUnassigned,
            pending: pendingUnassigned,
            byCity,
            oldestUnassigned: oldestParcel?.createdAt || null
        };
    }

    async bulkAssignDriver(assignmentDto: BulkDriverAssignmentDto): Promise<AdminParcelResponse[]> {
        const {parcelIds, driverId, pickupTime, notes} = assignmentDto;

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
            }
        }

        return results;
    }

    async updateParcelStatus(
        parcelId: string,
        updateStatusDto: UpdateParcelStatusDto,
        adminId: string
    ): Promise<AdminParcelResponse> {
        const {status, currentLocation} = updateStatusDto;

        let coordinates: CoordinatesDto | undefined;
        if (currentLocation) {
            coordinates = {
                lat: currentLocation.latitude,
                lng: currentLocation.longitude
            };
        }

        const updatedParcel = await this.parcelsService.updateStatus(
            parcelId,
            status as ParcelStatus,
            currentLocation?.address,
            coordinates
        );

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

    private async createOrFindLocation(locationDto: LocationCreateDto) {
        const existingLocation = await this.prisma.location.findFirst({
            where: {
                latitude: locationDto.latitude,
                longitude: locationDto.longitude,
                address: locationDto.address
            }
        });

        if (existingLocation) {
            return existingLocation;
        }

        return this.prisma.location.create({
            data: {
                name: locationDto.name,
                address: locationDto.address,
                latitude: locationDto.latitude,
                longitude: locationDto.longitude
            }
        });
    }

    private transformToAdminParcelResponse(parcel: any, senderDetails: SenderSearchResult): AdminParcelResponse {
        try {
            // Validate inputs
            if (!parcel) {
                throw new BadRequestException('Parcel is null or undefined');
            }

            if (!senderDetails) {
                throw new BadRequestException('SenderDetails is null or undefined');
            }

            return {
                ...parcel,
                senderDetails: {
                    id: senderDetails.id,
                    name: senderDetails.name || '',
                    email: senderDetails.email || '',
                    phone: senderDetails.phone || '',
                    totalOrders: senderDetails.totalParcels || 0,
                    isActive: senderDetails.isActive,
                    deletedAt: senderDetails.deletedAt
                },
                driverDetails: parcel.driver ? {
                    id: parcel.driver.id,
                    name: parcel.driver.name || '',
                    email: parcel.driver.email || '',
                    phone: parcel.driver.phone || '',
                    isActive: parcel.driver.isActive,
                    deletedAt: parcel.driver.deletedAt ? parcel.driver.deletedAt.toISOString() : undefined
                } : undefined
            };
        } catch (error) {
            console.error('Error in transformToAdminParcelResponse:', error);
            console.error('Parcel data:', JSON.stringify(parcel, null, 2));
            console.error('SenderDetails data:', JSON.stringify(senderDetails, null, 2));
            throw error;
        }
    }

    private async fetchAndTransformParcels(
        where: Prisma.ParcelWhereInput,
        page: number,
        limit: number
    ): Promise<PaginatedResponse<AdminParcelResponse>> {
        const parcelQuery: ParcelQueryDto = {
            page,
            limit,
            status: typeof where.status === 'string' ? where.status as ParcelStatus : undefined,
            senderId: typeof where.senderId === 'string' ? where.senderId : undefined,
            receiverId: typeof where.receiverId === 'string' ? where.receiverId : undefined,
            driverId: typeof where.driverId === 'string' ? where.driverId : undefined,
            trackingNumber: typeof where.trackingNumber === 'object' && where.trackingNumber && 'contains' in where.trackingNumber
                ? where.trackingNumber.contains as string
                : undefined,
        };

        const parcelResult = await this.parcelsService.findAll(parcelQuery);

        // Log parcels for debugging
        console.log('fetchAndTransformParcels parcels:', JSON.stringify(parcelResult.data, null, 2));

        const transformedParcels = await Promise.all(
            parcelResult.data
                .filter(parcel => {
                    if (!parcel || !parcel.senderId || !parcel.sender?.id) {
                        console.warn(`Invalid parcel detected: ${JSON.stringify(parcel, null, 2)}`);
                        return false;
                    }
                    return true;
                })
                .map(async (parcel) => {
                    try {
                        const senderDetails = await this.getSenderDetails(parcel.senderId);
                        return this.transformToAdminParcelResponse(parcel, senderDetails);
                    } catch (error) {
                        console.error(`Error processing parcel ${parcel.id}:`, error);
                        return null; // Skip invalid parcels
                    }
                })
        );

        // Filter out any null results
        const validParcels = transformedParcels.filter((parcel): parcel is AdminParcelResponse => parcel !== null);

        return {
            data: validParcels,
            total: parcelResult.total,
            page: parcelResult.page,
            limit: parcelResult.limit,
            totalPages: parcelResult.totalPages,
        };
    }
}