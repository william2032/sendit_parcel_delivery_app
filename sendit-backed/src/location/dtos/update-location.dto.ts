import { PartialType } from '@nestjs/mapped-types';
import { CreateLocationDto } from './create-location.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
    @ApiPropertyOptional({
        description: 'Name of the location',
        example: 'Nairobi Central Office - Updated',
    })
    name?: string;

    @ApiPropertyOptional({
        description: 'Physical address of the location',
        example: 'Kenyatta Avenue, Nairobi, Kenya',
    })
    address?: string;

    @ApiPropertyOptional({
        description: 'Latitude coordinate',
        example: -1.2921,
    })
    latitude?: number;

    @ApiPropertyOptional({
        description: 'Longitude coordinate',
        example: 36.8219,
    })
    longitude?: number;
}
