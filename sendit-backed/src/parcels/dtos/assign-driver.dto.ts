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
}