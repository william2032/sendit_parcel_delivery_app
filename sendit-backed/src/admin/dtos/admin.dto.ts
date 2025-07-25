// dtos/admin.dto.ts

import { IsString, IsEmail, IsOptional, IsNumber, IsEnum, IsBoolean, ValidateNested, IsArray, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationDto {
    @ApiProperty({ example: 'Nairobi CBD Office' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Kimathi Street, Nairobi CBD, Kenya' })
    @IsString()
    address: string;

    @ApiProperty({ example: -1.2864 })
    @IsNumber()
    lat: number;

    @ApiProperty({ example: 36.8172 })
    @IsNumber()
    lng: number;
}

export class AdminCreateParcelDto {
    @ApiProperty({ example: 'user123', description: 'Selected sender ID from search' })
    @IsString()
    senderId: string;

    @ApiPropertyOptional({ example: '+254712345678' })
    @IsOptional()
    @IsString()
    senderPhone?: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    receiverName: string;

    @ApiProperty({ example: '+254712345679' })
    @IsString()
    receiverPhone: string;

    @ApiPropertyOptional({ example: 'john.doe@email.com' })
    @IsOptional()
    @IsEmail()
    receiverEmail?: string;

    @ApiProperty({ example: 2.5, description: 'Weight in kg' })
    @IsNumber()
    @Min(0.1)
    @Max(1000)
    weight: number;

    @ApiProperty({ enum: ['LIGHT', 'MEDIUM', 'HEAVY', 'EXTRA_HEAVY'] })
    @IsEnum(['LIGHT', 'MEDIUM', 'HEAVY', 'EXTRA_HEAVY'])
    weightCategory: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'EXTRA_HEAVY';

    @ApiPropertyOptional({ example: 'Fragile electronics package' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ type: LocationDto })
    @ValidateNested()
    @Type(() => LocationDto)
    pickupLocation: LocationDto;

    @ApiProperty({ type: LocationDto })
    @ValidateNested()
    @Type(() => LocationDto)
    destinationLocation: LocationDto;

    @ApiPropertyOptional({ example: 'driver123' })
    @IsOptional()
    @IsString()
    driverId?: string;

    @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
    @IsOptional()
    @IsString()
    pickupTime?: string;

    @ApiPropertyOptional({ example: '2024-01-15T18:00:00Z' })
    @IsOptional()
    @IsString()
    estimatedDeliveryTime?: string;

    @ApiProperty({ example: 1500, description: 'Price in smallest currency unit (cents)' })
    @IsNumber()
    @Min(0)
    quote: number;

    @ApiPropertyOptional({ example: 'KES', default: 'KES' })
    @IsOptional()
    @IsString()
    currency?: string;
}

export class SenderSearchDto {
    @ApiProperty({ example: 'john', description: 'Search term for sender name or email' })
    @IsString()
    query: string;

    @ApiPropertyOptional({ example: 10, default: 10 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number = 10;
}

export class DriverSearchDto {
    @ApiPropertyOptional({ example: 'nairobi' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ example: -1.2864 })
    @IsOptional()
    @IsNumber()
    lat?: number;

    @ApiPropertyOptional({ example: 36.8172 })
    @IsOptional()
    @IsNumber()
    lng?: number;

    @ApiPropertyOptional({ example: 10, description: 'Radius in km for location-based search' })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(100)
    radius?: number = 10;

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    onlineOnly?: boolean = true;

    @ApiPropertyOptional({ example: 5, description: 'Maximum assigned parcels' })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(0)
    @Max(20)
    maxAssignedParcels?: number = 5;
}

export class BulkDriverAssignmentDto {
    @ApiProperty({ type: [String], example: ['parcel1', 'parcel2'] })
    @IsArray()
    @IsString({ each: true })
    parcelIds: string[];

    @ApiProperty({ example: 'driver123' })
    @IsString()
    driverId: string;

    @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
    @IsOptional()
    @IsString()
    pickupTime?: string;

    @ApiPropertyOptional({ example: 'Bulk assignment for route optimization' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class AdminParcelQueryDto {
    @ApiPropertyOptional({ example: 1, default: 1 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 20, default: 20 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({ example: 'PENDING' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ example: 'driver123' })
    @IsOptional()
    @IsString()
    driverId?: string;

    @ApiPropertyOptional({ example: 'sender123' })
    @IsOptional()
    @IsString()
    senderId?: string;

    @ApiPropertyOptional({ example: '2024-01-01' })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiPropertyOptional({ example: '2024-01-31' })
    @IsOptional()
    @IsString()
    dateTo?: string;

    @ApiPropertyOptional({ example: 'TRK123' })
    @IsOptional()
    @IsString()
    trackingNumber?: string;
}

export class UpdateParcelStatusDto {
    @ApiProperty({ enum: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'] })
    @IsEnum(['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'])
    status: string;

    @ApiPropertyOptional({ type: LocationDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    currentLocation?: LocationDto;
}