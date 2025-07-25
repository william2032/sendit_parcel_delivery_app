import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LocationQueryDto {
    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Search term for location name or address',
        required: false,
        example: 'Nairobi'
    })
    search?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @ApiProperty({
        description: 'Page number for pagination',
        required: false,
        example: 1,
        minimum: 1
    })
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    @ApiProperty({
        description: 'Number of items per page',
        required: false,
        example: 10,
        minimum: 1,
        maximum: 100
    })
    limit?: number = 10;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Sort field',
        required: false,
        example: 'name',
        enum: ['name', 'address', 'createdAt', 'updatedAt']
    })
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'Sort order',
        required: false,
        example: 'desc',
        enum: ['asc', 'desc']
    })
    sortOrder?: 'asc' | 'desc' = 'desc';
}