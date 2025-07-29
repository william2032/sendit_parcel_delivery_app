import {ParcelI} from "../../parcels/interfaces/parcel.interface";

export interface SenderSearchResult {
    id: string;
    name: string;
    email: string;
    phone: string;
    city?: string;
    country?: string;
    totalParcels: number;
    recentParcels: RecentParcel[];
    isActive: boolean;
    deletedAt?: string;
}

export interface RecentParcel {
    id: string;
    trackingNumber: string;
    status: string;
    createdAt: string;
    destination: string;
}

export interface AvailableDriver {
    id: string;
    name: string;
    email: string;
    phone: string;
    currentLocation?: {
        lat: number;
        lng: number;
        address: string;
    };
    assignedParcels: number;
    lastSeen: string;
    isActive: boolean;
    deletedAt?: string;
}

export interface AdminCreateParcelDto {
    // Sender (selected from search)
    senderId: string;
    senderPhone?: string;

    // Receiver information
    receiverName: string;
    receiverPhone: string;
    receiverEmail?: string;

    // Parcel details
    weight: number;
    weightCategory: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'EXTRA_HEAVY';
    description?: string;

    // Locations
    pickupLocation: {
        name: string;
        address: string;
        lat: number;
        lng: number;
    };

    destinationLocation: {
        name: string;
        address: string;
        lat: number;
        lng: number;
    };

    // Optional driver assignment
    driverId?: string;
    pickupTime?: string;
    estimatedDeliveryTime?: string;

    // Pricing
    quote: number;
    currency?: string;
}

export interface AdminParcelResponse extends ParcelI {
    senderDetails: {
        id: string;
        name: string;
        email: string;
        phone: string;
        totalOrders: number;
        isActive: boolean; // Added
        deletedAt?: string;
    };
    driverDetails?: {
        id: string;
        name: string;
        email: string;
        phone: string;
        rating?: number;
        isActive: boolean; // Added
        deletedAt?: string;
    };
}

export interface AdminDashboardStats {
    activeUsers: number;
    totalParcels: number;
    pendingParcels: number;
    inTransitParcels: number;
    deliveredToday: number;
    totalRevenue: number;
    activeDrivers: number;
    recentOrders: AdminParcelResponse[];
}

export interface DriverAssignmentDto {
    parcelId: string;
    driverId: string;
    pickupTime?: string;
    notes?: string;
}

export interface LocationCreateDto {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}