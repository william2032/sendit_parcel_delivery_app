export interface LocationI {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface UpdateDriverLocationDto {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface LocationSearchDto {
  query: string;
  limit?: number;
}

export interface DriverLocationResponseDto {
  id: string;
  driverId: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
  affectedParcels: Array<{
    id: string;
    trackingNumber: string;
    status: string;
    action: 'delivered' | 'location_updated';
  }>;
}

export interface LocationSuggestionDto {
  displayName: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
}

export interface DriverLocationI {
  id: string;
  driverId: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
}

export interface NotifyPickupDto {
  pickupLocation?: string;
}

export interface NotifyReceiverPickupDto {
  arrivalLocation?: string;
  pickupInstructions?: string;
}

export interface ConfirmManualDeliveryDto {
  deliveryLocation?: string;
  deliveryNotes?: string;
}
