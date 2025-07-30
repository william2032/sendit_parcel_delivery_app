import {
    Controller,
    Post,
    Get,
    Put,
    Body,
    Query,
    Param,
    UseGuards,
    BadRequestException,
    HttpStatus,
    Req,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
    UpdateDriverLocationDto,
    LocationSearchDto,
    DriverLocationResponseDto,
    LocationSuggestionDto,
    NotifyPickupDto,
    NotifyReceiverPickupDto,
    ConfirmManualDeliveryDto,
} from './dtos/driver-location.dto';
import { DriverLocationI } from './interfaces/driver-location.interface';
import { DriversService } from './drivers.service';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role?: string;
    };
}

@ApiTags('drivers')
@Controller('drivers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class DriversController {
    constructor(private readonly driversService: DriversService) {}

    // Route: PUT /drivers/:driverId/location (matches frontend expectation)
    @Put(':driverId/location')
    @ApiOperation({
        summary: 'Update driver location',
        description: 'Updates the current location of a driver and automatically processes parcel deliveries and status updates',
    })
    @ApiParam({ name: 'driverId', description: 'Driver ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Location updated successfully',
        type: DriverLocationResponseDto,
    })
    async updateDriverLocation(
        @Param('driverId') driverId: string,
        @Body() updateLocationDto: UpdateDriverLocationDto,
    ): Promise<DriverLocationResponseDto> {
        return this.driversService.updateDriverLocation(driverId, updateLocationDto);
    }

    // Route: GET /drivers/:driverId/locations (matches frontend expectation)
    @Get(':driverId/locations')
    @ApiOperation({
        summary: 'Get driver location history',
        description: 'Retrieves the location history for a specific driver',
    })
    @ApiParam({ name: 'driverId', description: 'Driver ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Location history retrieved successfully',
        type: [DriverLocationResponseDto],
    })
    async getDriverLocations(
        @Param('driverId') driverId: string
    ): Promise<DriverLocationI[]> {
        return this.driversService.getDriverLocations(driverId);
    }

    // Route: GET /drivers/:driverId/location/current (matches frontend expectation)
    @Get(':driverId/location/current')
    @ApiOperation({
        summary: 'Get current driver location',
        description: 'Retrieves the most recent location of a specific driver',
    })
    @ApiParam({ name: 'driverId', description: 'Driver ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Current location retrieved successfully',
        type: DriverLocationResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'No location found for driver',
    })
    async getDriverCurrentLocation(
        @Param('driverId') driverId: string
    ): Promise<DriverLocationI | null> {
        return this.driversService.getDriverCurrentLocation(driverId);
    }

    // Route: GET /drivers/:driverId/parcels (matches frontend expectation)
    @Get(':driverId/parcels')
    @ApiOperation({
        summary: 'Get assigned parcels',
        description: 'Retrieves all parcels currently assigned to a specific driver',
    })
    @ApiParam({ name: 'driverId', description: 'Driver ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Assigned parcels retrieved successfully',
    })
    async getDriverAssignedParcels(@Param('driverId') driverId: string) {
        return this.driversService.getDriverAssignedParcels(driverId);
    }

    @Get('locations/search')
    @ApiOperation({
        summary: 'Search locations for autocompletion',
        description: 'Provides location suggestions for autocompletion based on a search query',
    })
    @ApiQuery({
        name: 'query',
        description: 'Search query (minimum 2 characters)',
        example: 'Nairobi',
    })
    @ApiQuery({
        name: 'limit',
        description: 'Maximum number of suggestions to return',
        example: 10,
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Location suggestions retrieved successfully',
        type: [LocationSuggestionDto],
    })
    async searchLocations(
        @Query('query') query: string,
        @Query('limit') limit?: number,
    ): Promise<LocationSuggestionDto[]> {
        if (!query || query.length < 2) {
            throw new BadRequestException('Query must be at least 2 characters long');
        }

        const searchDto: LocationSearchDto = {
            query,
            limit: limit || 10,
        };

        return this.driversService.searchLocations(searchDto);
    }

    // Route: POST /drivers/:driverId/parcels/:parcelId/pickup (matches frontend expectation)
    @Post(':driverId/parcels/:parcelId/pickup')
    @ApiOperation({
        summary: 'Notify pickup completion',
        description: 'Notify that a parcel has been picked up by the driver',
    })
    @ApiParam({ name: 'driverId', description: 'Driver ID' })
    @ApiParam({ name: 'parcelId', description: 'Parcel ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Pickup notification sent successfully',
    })
    async notifyParcelPickup(
        @Param('driverId') driverId: string,
        @Param('parcelId') parcelId: string,
        @Body() pickupData: NotifyPickupDto = {},
    ): Promise<{ message: string }> {
        await this.driversService.notifyParcelPickup(driverId, parcelId, pickupData);
        return { message: 'Pickup notification sent successfully' };
    }

    @Post(':driverId/parcels/:parcelId/notify-receiver')
    @ApiOperation({
        summary: 'Notify receiver for pickup',
        description: 'Notify receiver that driver has arrived at destination for pickup',
    })
    @ApiParam({ name: 'driverId', description: 'Driver ID' })
    @ApiParam({ name: 'parcelId', description: 'Parcel ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Receiver pickup notification sent successfully',
    })
    async notifyReceiverForPickup(
        @Param('driverId') driverId: string,
        @Param('parcelId') parcelId: string,
        @Body() notifyData: NotifyReceiverPickupDto = {},
    ): Promise<{ message: string }> {
        await this.driversService.notifyReceiverForPickup(driverId, parcelId, notifyData);
        return { message: 'Receiver pickup notification sent successfully' };
    }

    @Post(':driverId/parcels/:parcelId/manual-delivery')
    @ApiOperation({
        summary: 'Confirm manual delivery',
        description: 'Manually confirm that a parcel has been delivered',
    })
    @ApiParam({ name: 'driverId', description: 'Driver ID' })
    @ApiParam({ name: 'parcelId', description: 'Parcel ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Manual delivery confirmed successfully',
    })
    async confirmManualDelivery(
        @Param('driverId') driverId: string,
        @Param('parcelId') parcelId: string,
        @Body() deliveryData: ConfirmManualDeliveryDto = {},
    ): Promise<{ message: string }> {
        await this.driversService.confirmManualDelivery(driverId, parcelId, deliveryData);
        return { message: 'Manual delivery confirmed successfully' };
    }

    @Post('location')
    @ApiOperation({
        summary: 'Update authenticated driver location',
        description: 'Updates location for the currently authenticated driver',
    })
    async updateAuthenticatedDriverLocation(
        @Req() req: AuthenticatedRequest,
        @Body() updateLocationDto: UpdateDriverLocationDto,
    ): Promise<DriverLocationResponseDto> {
        const user = req.user;
        if (!user || user.role !== 'DRIVER') {
            throw new BadRequestException('Only drivers can update their location');
        }
        return this.driversService.updateDriverLocation(user.id, updateLocationDto);
    }

    @Get('locations')
    @ApiOperation({
        summary: 'Get authenticated driver location history',
        description: 'Retrieves location history for the currently authenticated driver',
    })
    async getAuthenticatedDriverLocations(
        @Req() req: AuthenticatedRequest
    ): Promise<DriverLocationI[]> {
        const user = req.user;
        if (!user || user.role !== 'DRIVER') {
            throw new BadRequestException('Only drivers can view their location history');
        }
        return this.driversService.getDriverLocations(user.id);
    }

    @Get('location/current')
    @ApiOperation({
        summary: 'Get authenticated driver current location',
        description: 'Retrieves current location for the currently authenticated driver',
    })
    async getAuthenticatedDriverCurrentLocation(
        @Req() req: AuthenticatedRequest
    ): Promise<DriverLocationI | null> {
        const user = req.user;
        if (!user || user.role !== 'DRIVER') {
            throw new BadRequestException('Only drivers can view their current location');
        }
        return this.driversService.getDriverCurrentLocation(user.id);
    }

    @Get('parcels/assigned')
    @ApiOperation({
        summary: 'Get authenticated driver assigned parcels',
        description: 'Retrieves assigned parcels for the currently authenticated driver',
    })
    async getAuthenticatedDriverAssignedParcels(
        @Req() req: AuthenticatedRequest
    ) {
        const user = req.user;
        if (!user || user.role !== 'DRIVER') {
            throw new BadRequestException('Only drivers can view their assigned parcels');
        }
        return this.driversService.getDriverAssignedParcels(user.id);
    }
}