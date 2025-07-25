import { ApiProperty } from '@nestjs/swagger';

export class LocationResponseDto {
    @ApiProperty({
        description: 'Unique identifier for the location',
        example: 'clxyz123abc456def'
    })
    id: string;

    @ApiProperty({
        description: 'Name of the location',
        example: 'Nairobi Central Office'
    })
    name: string;

    @ApiProperty({
        description: 'Physical address of the location',
        example: 'Kenyatta Avenue, Nairobi, Kenya'
    })
    address: string;

    @ApiProperty({
        description: 'Latitude coordinate',
        example: -1.2921
    })
    latitude: number;

    @ApiProperty({
        description: 'Longitude coordinate',
        example: 36.8219
    })
    longitude: number;

    @ApiProperty({
        description: 'Creation timestamp',
        example: '2025-01-15T10:30:00Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Last update timestamp',
        example: '2025-01-15T10:30:00Z'
    })
    updatedAt: Date;
}