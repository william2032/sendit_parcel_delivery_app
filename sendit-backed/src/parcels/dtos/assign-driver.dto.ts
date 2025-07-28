import {
    IsString,
    IsOptional,
    IsDateString
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignDriverDto {
    @ApiProperty()
    @IsString()
    driverId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    pickupTime?: string;

    @ApiPropertyOptional({ description: 'Optional estimated delivery time for the parcel' })
    @IsOptional()
    @IsDateString()
    estimatedDeliveryTime?: string;
}