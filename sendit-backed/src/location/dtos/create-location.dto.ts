import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLocationDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Name of the location',
        example: 'Nairobi Central Office'
    })
    name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Physical address of the location',
        example: 'Kenyatta Avenue, Nairobi, Kenya'
    })
    address: string;

    @IsOptional()
    @IsNumber()
    @ApiProperty({
        description: 'Latitude coordinate (optional - will be geocoded if not provided)',
        example: -1.2921,
        required: false
    })
    latitude?: number;

    @IsOptional()
    @IsNumber()
    @ApiProperty({
        description: 'Longitude coordinate (optional - will be geocoded if not provided)',
        example: 36.8219,
        required: false
    })
    longitude?: number;
}