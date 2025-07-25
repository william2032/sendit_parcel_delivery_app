import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeocodeRequestDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Address to geocode',
        example: 'Kenyatta Avenue, Nairobi, Kenya'
    })
    address: string;
}