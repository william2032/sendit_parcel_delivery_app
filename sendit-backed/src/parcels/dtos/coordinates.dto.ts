import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CoordinatesDto {
    @ApiProperty()
    @IsNumber()
    lat: number;

    @ApiProperty()
    @IsNumber()
    lng: number;
}