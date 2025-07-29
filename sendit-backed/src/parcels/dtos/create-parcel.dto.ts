import {
    IsString,
    IsNumber,
    IsEmail,
    IsOptional,
    IsEnum,
    IsDateString,
    Min
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {WeightCategory} from "./enums";

export class CreateParcelDto {
    @ApiProperty()
    @IsString()
    senderId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    senderPhone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    receiverId?: string;

    @ApiProperty()
    @IsString()
    receiverName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    receiverPhone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    receiverEmail?: string;

    @ApiProperty()
    @IsNumber()
    @Min(0.1)
    weight: number;

    @ApiProperty({ enum: WeightCategory })
    @IsEnum(WeightCategory)
    weightCategory: 'ULTRA_LIGHT' | 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'EXTRA_HEAVY' | 'FREIGHT';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsString()
    pickupLocationId: string;

    @ApiProperty()
    @IsString()
    destinationLocationId: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    quote: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    estimatedDeliveryTime?: string;
}