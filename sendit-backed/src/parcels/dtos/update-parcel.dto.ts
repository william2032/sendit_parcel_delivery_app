import {IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min} from 'class-validator';

enum PrismaWeightCategory {
    ULTRA_LIGHT = 'ULTRA_LIGHT',
    LIGHT = 'LIGHT',
    MEDIUM = 'MEDIUM',
    HEAVY = 'HEAVY',
    EXTRA_HEAVY = 'EXTRA_HEAVY',
    FREIGHT = 'FREIGHT',
}

enum ParcelStatus {
    PENDING = 'PENDING',
    PICKED_UP = 'PICKED_UP',
    IN_TRANSIT = 'IN_TRANSIT',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

export class UpdateParcelDto {
    @IsOptional()
    @IsString()
    senderName?: string;

    @IsOptional()
    @IsString()
    senderPhone?: string;

    @IsOptional()
    @IsString()
    senderEmail?: string;

    @IsOptional()
    @IsString()
    receiverName?: string;

    @IsOptional()
    @IsString()
    receiverPhone?: string;

    @IsOptional()
    @IsString()
    receiverEmail?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    pickupAddress?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    destinationAddress?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    weight?: number;

    @IsOptional()
    @IsEnum(PrismaWeightCategory)
    weightCategory?: PrismaWeightCategory;

    @IsOptional()
    @IsDateString()
    estimatedDeliveryTime?: string;

    @IsOptional()
    @IsEnum(ParcelStatus)
    status?: ParcelStatus;
}

