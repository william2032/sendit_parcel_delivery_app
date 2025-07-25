import {ParcelStatus} from "../../parcels/dtos";

export interface DriverLocationI {
    id: string;
    driverId: string;
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: string;
}

export interface LocationUpdateResult {
    location: DriverLocationI | null;
    affectedParcels: Array<{
        id: string;
        trackingNumber: string;
        status: ParcelStatus;
        action: 'delivered' | 'location_updated';
    }>;
}

export interface LocationProximityCheck {
    isAtDestination: boolean;
    distance: number; // in meters
    threshold: number; // in meters
}

export interface GeocodingResult {
    latitude: number;
    longitude: number;
    address: string;
    confidence: number;
}

export interface LocationSuggestion {
    displayName: string;
    address: string;
    latitude: number;
    longitude: number;
    type?: string;
    relevance?: number;
}