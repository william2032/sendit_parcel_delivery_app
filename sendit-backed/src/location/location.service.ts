import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import {ILocationService} from "./interfaces/location-service.interface";
import {ILocationRepository} from "./interfaces/location-repository.interface";
import {GeocodingService} from "./geocoding/geocoding.service";
import {CreateLocationDto, GeocodeResponseDto, LocationQueryDto, LocationResponseDto, UpdateLocationDto} from "./dtos";


@Injectable()
export class LocationService implements ILocationService {
    private readonly logger = new Logger(LocationService.name);

    constructor(
        @Inject('LOCATION_REPOSITORY') private locationRepository: ILocationRepository,
        private geocodingService: GeocodingService
    ) {}

    async createLocation(data: CreateLocationDto): Promise<LocationResponseDto> {
        try {
            // If coordinates are not provided, geocode the address
            if (!data.latitude || !data.longitude) {
                const geocodeResult = await this.geocodingService.geocodeAddress(data.address);
                data.latitude = geocodeResult.latitude;
                data.longitude = geocodeResult.longitude;
            }

            return await this.locationRepository.create(data);
        } catch (error) {
            this.logger.error('Failed to create location', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to create location', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getLocationById(id: string): Promise<LocationResponseDto> {
        const location = await this.locationRepository.findById(id);
        if (!location) {
            throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
        }
        return location;
    }

    async getLocations(query: LocationQueryDto) {
        return await this.locationRepository.findMany(query);
    }

    async updateLocation(id: string, data: UpdateLocationDto): Promise<LocationResponseDto> {
        try {
            // Check if location exists
            await this.getLocationById(id);

            // If address is updated but coordinates are not provided, geocode the new address
            if (data.address && (!data.latitude || !data.longitude)) {
                const geocodeResult = await this.geocodingService.geocodeAddress(data.address);
                data.latitude = geocodeResult.latitude;
                data.longitude = geocodeResult.longitude;
            }

            return await this.locationRepository.update(id, data);
        } catch (error) {
            this.logger.error(`Failed to update location ${id}`, error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to update location', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteLocation(id: string): Promise<void> {
        // Check if location exists
        await this.getLocationById(id);
        await this.locationRepository.delete(id);
    }

    async geocodeAddress(address: string): Promise<GeocodeResponseDto> {
        return await this.geocodingService.geocodeAddress(address);
    }

    async findNearbyLocations(latitude: number, longitude: number, radiusKm: number = 10): Promise<LocationResponseDto[]> {
        return await this.locationRepository.findByCoordinates(latitude, longitude, radiusKm);
    }
}