import { ApiProperty } from '@nestjs/swagger';

export class GeocodeResponseDto {
    @ApiProperty({
        description: 'Formatted address',
        example: 'Kenyatta Ave, Nairobi, Kenya'
    })
    formattedAddress: string;

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
        description: 'Place ID from Google Maps',
        example: 'ChIJF1234567890abcdef'
    })
    placeId: string;
}