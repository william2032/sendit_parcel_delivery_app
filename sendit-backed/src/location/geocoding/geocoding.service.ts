import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {GeocodeResponseDto} from "../dtos";

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);

    constructor(@Inject('OPENCAGE_CONFIG') private config: { apiKey: string }) {
        this.logger.log(`OpenCage API Key: ${this.config.apiKey}`);
    }

    async geocodeAddress(address: string): Promise<GeocodeResponseDto> {
        try {
            const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${this.config.apiKey}&limit=1&no_annotations=1`
            );

            if (!response.ok) {
                this.logger.error(`OpenCage API HTTP error: ${response.status} ${response.statusText}`);
                throw new HttpException('Geocoding service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
            }

            const data = await response.json();
            this.logger.log(`OpenCage API response: ${JSON.stringify(data)}`);

            if (data.status.code !== 200 || !data.results.length) {
                const errorMessage = data.status.message || 'Address not found';
                this.logger.error(`Geocoding failed with status: ${data.status.code}, error: ${errorMessage}`);
                throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
            }

            const result = data.results[0];
            const location = result.geometry;

            return {
                formattedAddress: result.formatted,
                latitude: location.lat,
                longitude: location.lng,
                placeId: result.annotations?.DMS || 'N/A', // OpenCage doesn't provide a direct placeId; use DMS or another identifier if needed
            };
        } catch (error) {
            this.logger.error(`Geocoding failed for address: ${address}`, error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Geocoding failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async reverseGeocode(latitude: number, longitude: number): Promise<string> {
        try {
            const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${this.config.apiKey}&limit=1&no_annotations=1`
            );

            if (!response.ok) {
                this.logger.error(`OpenCage reverse geocoding HTTP error: ${response.status} ${response.statusText}`);
                throw new HttpException('Reverse geocoding service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
            }

            const data = await response.json();
            this.logger.log(`OpenCage reverse geocoding response: ${JSON.stringify(data)}`);

            if (data.status.code !== 200 || !data.results.length) {
                const errorMessage = data.status.message || 'Address not found';
                this.logger.error(`Reverse geocoding failed with status: ${data.status.code}, error: ${errorMessage}`);
                throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
            }

            return data.results[0].formatted;
        } catch (error) {
            this.logger.error(`Reverse geocoding failed for coordinates: ${latitude}, ${longitude}`, error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Reverse geocoding failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}