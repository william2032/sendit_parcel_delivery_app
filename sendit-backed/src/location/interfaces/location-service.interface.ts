import {CreateLocationDto, GeocodeResponseDto, LocationQueryDto, LocationResponseDto, UpdateLocationDto} from "../dtos";


export interface ILocationService {
    createLocation(data: CreateLocationDto): Promise<LocationResponseDto>;
    getLocationById(id: string): Promise<LocationResponseDto>;
    getLocations(query: LocationQueryDto): Promise<{
        data: LocationResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateLocation(id: string, data: UpdateLocationDto): Promise<LocationResponseDto>;
    deleteLocation(id: string): Promise<void>;
    geocodeAddress(address: string): Promise<GeocodeResponseDto>;
    findNearbyLocations(latitude: number, longitude: number, radiusKm?: number): Promise<LocationResponseDto[]>;
}