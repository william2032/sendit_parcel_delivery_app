import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, ParseFloatPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

import { LocationService } from './location.service';
import {
    CreateLocationDto,
    GeocodeRequestDto,
    GeocodeResponseDto,
    LocationQueryDto,
    LocationResponseDto,
    UpdateLocationDto
} from "./dtos";

@Controller('locations')
@ApiTags('Locations')
export class LocationController {
    constructor(private readonly locationService: LocationService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new location' })
    @ApiResponse({
        status: 201,
        description: 'Location created successfully',
        type: LocationResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid input data',
    })
    @ApiResponse({
        status: 404,
        description: 'Address not found during geocoding',
    })
    @ApiResponse({
        status: 503,
        description: 'Geocoding service unavailable',
    })
    async createLocation(@Body() createLocationDto: CreateLocationDto): Promise<LocationResponseDto> {
        return await this.locationService.createLocation(createLocationDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all locations with pagination and search' })
    @ApiResponse({
        status: 200,
        description: 'Locations retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LocationResponseDto' },
                },
                total: { type: 'number', example: 100 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 10 },
            },
        },
    })
    async getLocations(@Query() query: LocationQueryDto) {
        return await this.locationService.getLocations(query);
    }

    @Get('geocode')
    @ApiOperation({ summary: 'Geocode an address to get coordinates' })
    @ApiResponse({
        status: 200,
        description: 'Address geocoded successfully',
        type: GeocodeResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Address not found',
    })
    @ApiResponse({
        status: 503,
        description: 'Geocoding service unavailable',
    })
    async geocodeAddress(@Query() geocodeDto: GeocodeRequestDto): Promise<GeocodeResponseDto> {
        return await this.locationService.geocodeAddress(geocodeDto.address);
    }

    @Get('nearby')
    @ApiOperation({ summary: 'Find nearby locations' })
    @ApiQuery({ name: 'latitude', type: 'number', example: -1.2921 })
    @ApiQuery({ name: 'longitude', type: 'number', example: 36.8219 })
    @ApiQuery({ name: 'radius', type: 'number', required: false, example: 10 })
    @ApiResponse({
        status: 200,
        description: 'Nearby locations found',
        type: [LocationResponseDto],
    })
    async findNearbyLocations(
        @Query('latitude', ParseFloatPipe) latitude: number,
        @Query('longitude', ParseFloatPipe) longitude: number,
        @Query('radius', new ParseFloatPipe({ optional: true })) radius?: number
    ): Promise<LocationResponseDto[]> {
        return await this.locationService.findNearbyLocations(latitude, longitude, radius);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a location by ID' })
    @ApiParam({ name: 'id', description: 'Location ID' })
    @ApiResponse({
        status: 200,
        description: 'Location found',
        type: LocationResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Location not found',
    })
    async getLocationById(@Param('id') id: string): Promise<LocationResponseDto> {
        return await this.locationService.getLocationById(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a location' })
    @ApiParam({ name: 'id', description: 'Location ID' })
    @ApiResponse({
        status: 200,
        description: 'Location updated successfully',
        type: LocationResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Location not found',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid input data',
    })
    async updateLocation(
        @Param('id') id: string,
        @Body() updateLocationDto: UpdateLocationDto
    ): Promise<LocationResponseDto> {
        return await this.locationService.updateLocation(id, updateLocationDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a location' })
    @ApiParam({ name: 'id', description: 'Location ID' })
    @ApiResponse({
        status: 204,
        description: 'Location deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Location not found',
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteLocation(@Param('id') id: string): Promise<void> {
        await this.locationService.deleteLocation(id);
    }
}