export enum WeightCategory {
    ULTRA_LIGHT = 'ULTRA_LIGHT',
    LIGHT = 'LIGHT',
    MEDIUM = 'MEDIUM',
    HEAVY = 'HEAVY',
    EXTRA_HEAVY = 'EXTRA_HEAVY',
    FREIGHT = 'FREIGHT'
}



export interface UserI {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
    deletedAt?: Date;
}

export interface LocationI {
    id: string;
    lat: number;
    lng: number;
    name: string;
    address: string;
}

export enum TrackingEventType {
    ORDER_CREATED = 'ORDER_CREATED',
    DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
    PICKED_UP = 'PICKED_UP',
    LOCATION_UPDATE = 'LOCATION_UPDATE',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    ARRIVED_AT_DESTINATION = 'ARRIVED_AT_DESTINATION',
    DELIVERED = 'DELIVERED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    EXCEPTION = 'EXCEPTION'
}


export interface TrackingEventI {
    id: string;
    parcelId: string;
    type: TrackingEventType;
    status: string;
    location: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    timestamp: string;
    description: string;
    notes?: string;
    driverId?: string;
    automated: boolean;
}

export interface ParcelI {
    id: string;
    trackingNumber: string;
    address: string;
    date: string;
    status: string;
    createdAt: string;

    // Location information
    pickupLocation: {
        lat: number;
        lng: number;
        name: string;
        address: string;
    };

    destination: {
        lat: number;
        lng: number;
        name: string;
        address: string;
    };

    currentLocation?: {
        lat: number;
        lng: number;
        address: string;
    };

    // Sender information
    senderId: string;
    sender?: UserI;
    senderName: string;
    senderPhone: string;
    senderEmail: string;

    // Receiver information
    receiverId?: string;
    receiver?: UserI;
    receiverName: string;
    receiverPhone: string;
    receiverEmail?: string;

    // Driver information
    driverId?: string;
    driver?: UserI;

    deliveryTime: string;
    estimatedDeliveryDate: string;
    trackingEvents: TrackingEventI[];
    price: number;

    notificationsSent: {
        customerPickup: boolean;
        customerDelivery: boolean;
        recipientDelivery: boolean;
        driverAssignment: boolean;
    };

    weight: number;
    weightCategory: WeightCategory;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}