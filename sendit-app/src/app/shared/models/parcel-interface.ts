export interface Parcel {
  id: string;
  address: string;
  date: string;
  status: string;
  pickupLocation: {
    lat: number;
    lng: number;
    name: string;
  };
  destination: {
    lat: number;
    lng: number;
    name: string;
  };
  weight: number;
  senderName: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  deliveryTime: string;
  trackingHistory?: TrackingEvent[];
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}
