import {
    IsString,
    IsOptional,
    IsEnum,
    IsBoolean,
    ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {$Enums} from "../../../generated/prisma";
import TrackingEventType = $Enums.TrackingEventType;
import {CoordinatesDto} from "./coordinates.dto";

export class CreateTrackingEventDto {
    @ApiProperty()
    @IsString()
    parcelId: string;

    @ApiProperty({ enum: TrackingEventType })
    @IsEnum(TrackingEventType)
    type: TrackingEventType;

    @ApiProperty()
    @IsString()
    status: string;

    @ApiProperty()
    @IsString()
    location: string;

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested()
    @Type(() => CoordinatesDto)
    coordinates?: CoordinatesDto;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    driverId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    automated?: boolean;
}