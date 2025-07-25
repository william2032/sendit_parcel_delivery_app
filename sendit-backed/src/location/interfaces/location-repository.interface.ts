import {CreateLocationDto, LocationQueryDto, LocationResponseDto, UpdateLocationDto} from "../dtos";

export interface ILocationRepository {
    create(data: CreateLocationDto): Promise<LocationResponseDto>;
    findById(id: string): Promise<LocationResponseDto | null>;
    findMany(query: LocationQueryDto): Promise<{
        data: LocationResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    update(id: string, data: UpdateLocationDto): Promise<LocationResponseDto>;
    delete(id: string): Promise<void>;
    findByCoordinates(latitude: number, longitude: number, radiusKm?: number): Promise<LocationResponseDto[]>;
}