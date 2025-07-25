import {
    IsString,
    IsNumber,
    Min,
    Max
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
    @ApiProperty()
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat: number;

    @ApiProperty()
    @IsNumber()
    @Min(-180)
    @Max(180)
    lng: number;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    address: string;
}