import {
    IsString,
    IsNumber,
    IsOptional,
    IsEnum,
    Min,
    Max
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {ParcelStatus} from "./enums";

export class ParcelQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    senderId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    receiverId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    driverId?: string;

    @ApiPropertyOptional({ enum: ParcelStatus })
    @IsOptional()
    @IsEnum(ParcelStatus)
    status?: ParcelStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    trackingNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}