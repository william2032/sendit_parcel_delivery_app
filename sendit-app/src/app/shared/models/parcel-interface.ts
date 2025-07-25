import {UserI} from './users.interface';

export interface Parcel {
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
  trackingEvents: TrackingEvent[];
  price: number;
  // Notifications (handled by backend)
  notificationsSent: {
    customerPickup: boolean;
    customerDelivery: boolean;
    recipientDelivery: boolean;
    driverAssignment: boolean;
  };

  weight: number;
  weightCategory: 'ULTRA_LIGHT' | 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'EXTRA_HEAVY' | 'FREIGHT';
}

export interface TrackingEvent {
  id: string;
  parcelId: string;
  type: 'ORDER_CREATED' | 'DRIVER_ASSIGNED' | 'PICKED_UP' | 'LOCATION_UPDATE' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'EXCEPTION';
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

export interface DeliveryOrder {
  id: string;
  deliveryAddress: string;
  date: string;
  weight: number;
  quote: string;
  status: 'Completed' | 'Picked' | 'In Transit' | 'Pending';
}

export interface DeliveryFormData {
  sender: string;
  receiver: string;
  emailAddress: string;
  receiverNo: string;
  deliveryLocation: string;
  pickupLocation: string;
  arrivalTime: string;
  weightCategory: string;
}

export interface DriverLocation {
  id: string;
  driverId: string;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

export interface DriverStats {
  totalAssigned: number;
  inProgress: number;
  completed: number;
  totalEarnings: number;
  rating: number;
  totalDeliveries: number;
}
