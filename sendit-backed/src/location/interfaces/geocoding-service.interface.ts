import {GeocodeResponseDto} from "../dtos";

export interface IGeocodingService {
    geocodeAddress(address: string): Promise<GeocodeResponseDto>;
    reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResponseDto>;
}