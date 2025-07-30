import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDriverLocationDto {
    @ApiProperty({
        description: 'Latitude coordinate',
        example: -1.2921,
        minimum: -90,
        maximum: 90,
    })
    @IsNumber()
    @Type(() => Number)
    @Min(-90)
    @Max(90)
    latitude: number;

    @ApiProperty({
        description: 'Longitude coordinate',
        example: 36.8219,
        minimum: -180,
        maximum: 180,
    })
    @IsNumber()
    @Type(() => Number)
    @Min(-180)
    @Max(180)
    longitude: number;

    @ApiPropertyOptional({
        description: 'Human-readable address',
        example: 'Nairobi CBD, Kenya',
    })
    @IsOptional()
    @IsString()
    address?: string;
}

export class LocationSearchDto {
    @ApiProperty({
        description: 'Search query for location autocompletion',
        example: 'Nairobi',
        minLength: 2,
    })
    @IsString()
    query: string;

    @ApiPropertyOptional({
        description: 'Maximum number of suggestions to return',
        example: 5,
        default: 10,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit?: number = 10;
}

export class DriverLocationResponseDto {
    @ApiProperty({
        description: 'Unique location record ID',
        example: 'clx123456789',
    })
    id: string;

    @ApiProperty({
        description: 'Driver ID',
        example: 'driver123',
    })
    driverId: string;

    @ApiProperty({
        description: 'Latitude coordinate',
        example: -1.2921,
    })
    latitude: number;

    @ApiProperty({
        description: 'Longitude coordinate',
        example: 36.8219,
    })
    longitude: number;

    @ApiPropertyOptional({
        description: 'Human-readable address',
        example: 'Nairobi CBD, Kenya',
    })
    address?: string;

    @ApiProperty({
        description: 'Timestamp when location was recorded',
        example: '2024-07-24T10:30:00Z',
    })
    timestamp: string;

    @ApiPropertyOptional({
        description: 'Parcels affected by this location update',
    })
    affectedParcels?: {
        id: string;
        trackingNumber: string;
        status: string;
        action: 'delivered' | 'location_updated';
    }[];
}

export class LocationSuggestionDto {
    @ApiProperty({
        description: 'Location display name',
        example: 'Nairobi CBD, Kenya',
    })
    displayName: string;

    @ApiProperty({
        description: 'Formatted address',
        example: 'Central Business District, Nairobi, Kenya',
    })
    address: string;

    @ApiProperty({
        description: 'Latitude coordinate',
        example: -1.2921,
    })
    latitude: number;

    @ApiProperty({
        description: 'Longitude coordinate',
        example: 36.8219,
    })
    longitude: number;

    @ApiPropertyOptional({
        description: 'Place type (e.g., city, street, landmark)',
        example: 'city',
    })
    type?: string;
}

export class NotifyPickupDto {
    @ApiProperty({
        description: 'Custom pickup location (optional)',
        example: 'Main entrance of the building',
        required: false,
    })
    @IsOptional()
    @IsString()
    pickupLocation?: string;
}

export class NotifyReceiverPickupDto {
    @ApiProperty({
        description: 'Arrival location (optional)',
        example: 'Outside the main gate',
        required: false,
    })
    @IsOptional()
    @IsString()
    arrivalLocation?: string;

    @ApiProperty({
        description: 'Special pickup instructions (optional)',
        example: 'Please call when you arrive',
        required: false,
    })
    @IsOptional()
    @IsString()
    pickupInstructions?: string;
}

export class ConfirmManualDeliveryDto {
    @ApiProperty({
        description: 'Delivery location (optional)',
        example: 'Left at front door',
        required: false,
    })
    @IsOptional()
    @IsString()
    deliveryLocation?: string;

    @ApiProperty({
        description: 'Additional delivery notes (optional)',
        example: 'Package delivered to receptionist',
        required: false,
    })
    @IsOptional()
    @IsString()
    deliveryNotes?: string;
}