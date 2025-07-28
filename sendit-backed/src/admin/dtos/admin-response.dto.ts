import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParcelStatus } from 'generated/prisma';

export class RecentParcelResponse {
    @ApiProperty({ example: 'parcel123' })
    id: string;

    @ApiProperty({ example: 'TRK001234' })
    trackingNumber: string;

    @ApiProperty({ enum: ParcelStatus, example: ParcelStatus.PENDING })
    status: ParcelStatus;

    @ApiProperty({ example: '2024-01-15T10:00:00Z' })
    createdAt: string;

    @ApiProperty({ example: 'Kimathi Street, Nairobi CBD, Kenya' })
    destination: string;
}

export class SenderSearchResponse {
    @ApiProperty({ example: 'user123' })
    id: string;

    @ApiProperty({ example: 'John Doe' })
    name: string;

    @ApiProperty({ example: 'john@example.com' })
    email: string;

    @ApiProperty({ example: '+254712345678' })
    phone: string;

    @ApiPropertyOptional({ example: 'Nairobi' })
    city?: string;

    @ApiPropertyOptional({ example: 'Kenya' })
    country?: string;

    @ApiProperty({ example: 15 })
    totalParcels: number;

    @ApiProperty({ type: [RecentParcelResponse] })
    recentParcels: RecentParcelResponse[];
}

export class CurrentLocationResponse {
    @ApiProperty({ example: -1.2864 })
    lat: number;

    @ApiProperty({ example: 36.8172 })
    lng: number;

    @ApiProperty({ example: 'Kimathi Street, Nairobi CBD, Kenya' })
    address: string;
}

export class AvailableDriverResponse {
    @ApiProperty({ example: 'driver123' })
    id: string;

    @ApiProperty({ example: 'Jane Smith' })
    name: string;

    @ApiProperty({ example: 'jane@example.com' })
    email: string;

    @ApiProperty({ example: '+254712345679' })
    phone: string;

    @ApiPropertyOptional({ type: CurrentLocationResponse })
    currentLocation?: CurrentLocationResponse;

    @ApiProperty({ example: 3 })
    assignedParcels: number;

    @ApiPropertyOptional({ example: 4.5 })
    rating?: number;

    @ApiPropertyOptional({ example: 'MOTORCYCLE' })
    vehicleType?: string;

    @ApiProperty({ example: true })
    isOnline: boolean;

    @ApiProperty({ example: '2024-01-15T14:30:00Z' })
    lastSeen: string;
}

export class LocationResponse {
    @ApiProperty({ example: 'loc123' })
    id: string;

    @ApiProperty({ example: 'Nairobi CBD Office' })
    name: string;

    @ApiProperty({ example: 'Kimathi Street, Nairobi CBD, Kenya' })
    address: string;

    @ApiProperty({ example: -1.2864 })
    lat: number;

    @ApiProperty({ example: 36.8172 })
    lng: number;
}

export class UserSummaryResponse {
    @ApiProperty({ example: 'user123' })
    id: string;

    @ApiProperty({ example: 'John Doe' })
    name: string;

    @ApiProperty({ example: 'john@example.com' })
    email: string;

    @ApiProperty({ example: '+254712345678' })
    phone: string;
}

export class SenderDetailsResponse {
    @ApiProperty({ example: 'user123' })
    id: string;

    @ApiProperty({ example: 'John Doe' })
    name: string;

    @ApiProperty({ example: 'john@example.com' })
    email: string;

    @ApiProperty({ example: '+254712345678' })
    phone: string;

    @ApiProperty({ example: 15 })
    totalOrders: number;
}

export class DriverDetailsResponse {
    @ApiProperty({ example: 'driver123' })
    id: string;

    @ApiProperty({ example: 'Jane Smith' })
    name: string;

    @ApiProperty({ example: 'jane@example.com' })
    email: string;

    @ApiProperty({ example: '+254712345679' })
    phone: string;

    @ApiPropertyOptional({ example: 'MOTORCYCLE' })
    vehicleType?: string;

    @ApiPropertyOptional({ example: 4.5 })
    rating?: number;
}

export class TrackingEventResponse {
    @ApiProperty({ example: 'event123' })
    id: string;

    @ApiProperty({ example: 'ORDER_CREATED' })
    type: string;

    @ApiProperty({ enum: ParcelStatus, example: ParcelStatus.PENDING })
    status: ParcelStatus;

    @ApiProperty({ example: 'Parcel order created' })
    description: string;

    @ApiPropertyOptional({ example: 'Additional notes' })
    notes?: string;

    @ApiPropertyOptional({ type: LocationResponse })
    location?: LocationResponse;

    @ApiProperty({ example: true })
    automated: boolean;

    @ApiProperty({ example: '2024-01-15T10:00:00Z' })
    timestamp: string;

    @ApiPropertyOptional({ example: 'user123' })
    updatedBy?: string;

    @ApiProperty({ example: '2024-01-15T10:00:00Z' })
    createdAt: string;
}

export class AdminParcelResponseClass {
    @ApiProperty({ example: 'parcel123' })
    id: string;

    @ApiProperty({ example: 'TRK001234' })
    trackingNumber: string;

    @ApiProperty({ example: 'user123' })
    senderId: string;

    @ApiPropertyOptional({ example: '+254712345678' })
    senderPhone?: string;

    @ApiPropertyOptional({ example: 'receiver123' })
    receiverId?: string;

    @ApiProperty({ example: 'John Receiver' })
    receiverName: string;

    @ApiProperty({ example: '+254712345679' })
    receiverPhone: string;

    @ApiPropertyOptional({ example: 'john.receiver@example.com' })
    receiverEmail?: string;

    @ApiPropertyOptional({ example: 'driver123' })
    driverId?: string;

    @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
    assignedAt?: string;

    @ApiPropertyOptional({ example: '2024-01-15T11:00:00Z' })
    pickupTime?: string;

    @ApiPropertyOptional({ example: '2024-01-15T16:00:00Z' })
    deliveredAt?: string;

    @ApiPropertyOptional({ example: '2024-01-15T16:30:00Z' })
    completedAt?: string;

    @ApiProperty({ example: 2.5 })
    weight: number;

    @ApiProperty({ example: 'MEDIUM' })
    weightCategory: string;

    @ApiPropertyOptional({ example: 'Fragile electronics package' })
    description?: string;

    @ApiProperty({ type: LocationResponse })
    pickupLocation: LocationResponse;

    @ApiProperty({ type: LocationResponse })
    destinationLocation: LocationResponse;

    @ApiProperty({ enum: ParcelStatus, example: ParcelStatus.PENDING })
    status: ParcelStatus;

    @ApiPropertyOptional({ example: '2024-01-15T18:00:00Z' })
    estimatedDeliveryTime?: string;

    @ApiPropertyOptional({ example: '2024-01-15T17:45:00Z' })
    actualDeliveryTime?: string;

    @ApiProperty({ example: 1500 })
    quote: number;

    @ApiProperty({ example: 'KES' })
    currency: string;

    @ApiProperty({ example: true })
    isActive: boolean;

    @ApiPropertyOptional({ example: null })
    deletedAt?: string;

    @ApiProperty({ example: '2024-01-15T09:00:00Z' })
    createdAt: string;

    @ApiProperty({ example: '2024-01-15T14:30:00Z' })
    updatedAt: string;

    @ApiProperty({ type: SenderDetailsResponse })
    senderDetails: SenderDetailsResponse;

    @ApiPropertyOptional({ type: DriverDetailsResponse })
    driverDetails?: DriverDetailsResponse;

    @ApiProperty({ type: [TrackingEventResponse] })
    trackingEvents: TrackingEventResponse[];

    @ApiPropertyOptional({ type: UserSummaryResponse })
    sender?: UserSummaryResponse;

    @ApiPropertyOptional({ type: UserSummaryResponse })
    receiver?: UserSummaryResponse;

    @ApiPropertyOptional({ type: UserSummaryResponse })
    driver?: UserSummaryResponse;
}

export class AdminDashboardStatsResponse {
    @ApiProperty({ example: 1250 })
    totalParcels: number;

    @ApiProperty({ example: 75 })
    pendingParcels: number;

    @ApiProperty({ example: 45 })
    inTransitParcels: number;

    @ApiProperty({ example: 25 })
    deliveredToday: number;

    @ApiProperty({ example: 125000 })
    totalRevenue: number;

    @ApiProperty({ example: 15 })
    activeDrivers: number;

    @ApiProperty({ type: [AdminParcelResponseClass] })
    recentOrders: AdminParcelResponseClass[];
}

export class PaginatedAdminParcelResponse {
    @ApiProperty({ type: [AdminParcelResponseClass] })
    data: AdminParcelResponseClass[];

    @ApiProperty({ example: 1250 })
    total: number;

    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 63 })
    totalPages: number;
}

export class ParcelStatsResponse {
    @ApiProperty({ example: 75 })
    pending: number;

    @ApiProperty({ example: 45 })
    inTransit: number;

    @ApiProperty({ example: 25 })
    delivered: number;

    @ApiProperty({ example: 1250 })
    total: number;
}

export class RevenueStatsResponse {
    @ApiProperty({ example: 125000 })
    totalRevenue: number;

    @ApiProperty({ example: 'monthly' })
    period: string;
}