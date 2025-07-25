import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocationSuggestion } from '../interfaces/driver-location.interface';

@Injectable()
export class LocationAutocompleteService {
    private readonly logger = new Logger(LocationAutocompleteService.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.opencagedata.com/geocode/v1/json';

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENCAGE_API_KEY');
        if (!apiKey) {
            this.logger.error('OPENCAGE_API_KEY is not configured');
            throw new HttpException('Location service not configured: Missing OPENCAGE_API_KEY', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        this.apiKey = apiKey;
    }

    async searchLocations(query: string, limit: number = 10): Promise<LocationSuggestion[]> {
        if (!this.apiKey) {
            throw new HttpException('Location service not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        if (query.length < 2) {
            return [];
        }

        try {
            const params = new URLSearchParams({
                key: this.apiKey,
                q: query,
                limit: limit.toString(),
                countrycode: 'ke', // Focus on Kenya
                no_annotations: '1', // Reduce response size
            });

            const response = await fetch(`${this.baseUrl}?${params}`);

            if (!response.ok) {
                throw new Error(`OpenCage API error: ${response.status}`);
            }

            const data = await response.json();

            return data.results?.map((result: any) => ({
                displayName: result.formatted,
                address: result.formatted,
                latitude: result.geometry.lat,
                longitude: result.geometry.lng,
                type: result.components._type || 'place',
                relevance: result.confidence / 10, // Normalize confidence to 0-1
            })) || [];

        } catch (error) {
            this.logger.error(`Failed to search locations for query:到来

System: query: ${query}`, error);
            return this.getFallbackSuggestions(query);
        }
    }

    async reverseGeocode(latitude: number, longitude: number): Promise<string> {
        if (!this.apiKey) {
            return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
        }

        try {
            const params = new URLSearchParams({
                key: this.apiKey,
                q: `${latitude},${longitude}`,
                no_annotations: '1',
            });

            const response = await fetch(`${this.baseUrl}?${params}`);

            if (!response.ok) {
                throw new Error(`OpenCage API error: ${response.status}`);
            }

            const data = await response.json();

            return data.results?.[0]?.formatted || `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;

        } catch (error) {
            this.logger.error(`Failed to reverse geocode coordinates: ${latitude}, ${longitude}`, error);
            return `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
        }
    }

    private getFallbackSuggestions(query: string): LocationSuggestion[] {
        const commonLocations = [
            { name: 'Nairobi CBD', lat: -1.2921, lng: 36.8219 },
            { name: 'Westlands, Nairobi', lat: -1.2676, lng: 36.8108 },
            { name: 'Karen, Nairobi', lat: -1.3197, lng: 36.6859 },
            { name: 'Kilimani, Nairobi', lat: -1.2953, lng: 36.7831 },
            { name: 'Kileleshwa, Nairobi', lat: -1.2708, lng: 36.7881 },
            { name: 'Lavington, Nairobi', lat: -1.2741, lng: 36.7671 },
            { name: 'Mombasa CBD', lat: -4.0435, lng: 39.6682 },
            { name: 'Kisumu CBD', lat: -0.0917, lng: 34.7680 },
            { name: 'Nakuru CBD', lat: -0.3031, lng: 36.0800 },
            { name: 'Eldoret CBD', lat: 0.5143, lng: 35.2698 },
        ];

        const filteredLocations = commonLocations.filter(location =>
            location.name.toLowerCase().includes(query.toLowerCase())
        );

        return filteredLocations.map(location => ({
            displayName: location.name,
            address: `${location.name}, Kenya`,
            latitude: location.lat,
            longitude: location.lng,
            type: 'place',
            relevance: 0.8,
        }));
    }
}