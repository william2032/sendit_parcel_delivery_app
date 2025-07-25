import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    UseGuards,
    BadRequestException,
    HttpStatus,
    Param, Request, Req
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import {AuthGuard} from '@nestjs/passport';
import {
    UpdateDriverLocationDto,
    LocationSearchDto,
    DriverLocationResponseDto,
    LocationSuggestionDto,
} from './dtos/driver-location.dto';
import {DriverLocationI} from './interfaces/driver-location.interface';
import {DriversService} from "./drivers.service";


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
    constructor(private readonly driversService: DriversService) {
    }

    @Post('location')
    @ApiOperation({
        summary: 'Update driver location',
        description: 'Updates the current location of a driver and automatically processes parcel deliveries and status updates',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Location updated successfully',
        type: DriverLocationResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid coordinates or user is not a driver',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Authentication required',
    })
    async updateLocation(
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
        summary: 'Get driver location history',
        description: 'Retrieves the location history for the authenticated driver',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Location history retrieved successfully',
        type: [DriverLocationResponseDto],
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'User is not a driver',
    })
    async getLocations(@Req() req: AuthenticatedRequest): Promise<DriverLocationI[]> {
        const user = req.user;
        if (!user || user.role !== 'DRIVER') {
            throw new BadRequestException('Only drivers can view their location history');
        }

        return this.driversService.getDriverLocations(user.id);
    }

    @Get('location/current')
    @ApiOperation({
        summary: 'Get current driver location',
        description: 'Retrieves the most recent location of the authenticated driver',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Current location retrieved successfully',
        type: DriverLocationResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'No location found for driver',
    })
    async getCurrentLocation(@Req() req: AuthenticatedRequest): Promise<DriverLocationI | null> {
        const user = req.user;
        if (!user || user.role !== 'DRIVER') {
            throw new BadRequestException('Only drivers can view their current location');
        }

        return this.driversService.getDriverCurrentLocation(user.id);
    }

    @Get('parcels/assigned')
    @ApiOperation({
        summary: 'Get assigned parcels',
        description: 'Retrieves all parcels currently assigned to the authenticated driver',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Assigned parcels retrieved successfully',
    })
    async getAssignedParcels(@Req() req: AuthenticatedRequest) {
        const user = req.user;
        if (!user || user.role !== 'DRIVER') {
            throw new BadRequestException('Only drivers can view their assigned parcels');
        }

        return this.driversService.getDriverAssignedParcels(user.id);
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
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid search query',
    })
    async searchLocations(
        @Req() req: AuthenticatedRequest,
        @Query('query') query: string,
        @Query('limit') limit?: number,
    ): Promise<LocationSuggestionDto[]> {
        const user = req.user;
        if (!user) {
            throw new BadRequestException('Authentication required');
        }

        if (!query || query.length < 2) {
            throw new BadRequestException('Query must be at least 2 characters long');
        }

        const searchDto: LocationSearchDto = {
            query,
            limit: limit || 10,
        };

        return this.driversService.searchLocations(searchDto);
    }
    @Post(':driverId/parcels/:parcelId/notify-pickup')
    @ApiOperation({ summary: 'Notify sender that parcel has been picked up' })
    async notifyParcelPickup(
        @Param('driverId') driverId: string,
        @Param('parcelId') parcelId: string,
        @Body() body: { pickupLocation?: string }
    ) {
        await this.driversService.notifyParcelPickup(
            driverId,
            parcelId,
            body.pickupLocation
        );
        return { message: 'Pickup notification sent successfully' };
    }

    @Post(':driverId/parcels/:parcelId/notify-receiver-pickup')
    @ApiOperation({ summary: 'Notify receiver that driver has arrived for pickup' })
    async notifyReceiverForPickup(
        @Param('driverId') driverId: string,
        @Param('parcelId') parcelId: string,
        @Body() body: {
            arrivalLocation?: string;
            pickupInstructions?: string;
        }
    ) {
        await this.driversService.notifyReceiverForPickup(
            driverId,
            parcelId,
            body.arrivalLocation,
            body.pickupInstructions
        );
        return { message: 'Receiver pickup notification sent successfully' };
    }

    @Post(':driverId/parcels/:parcelId/confirm-delivery')
    @ApiOperation({ summary: 'Manually confirm parcel delivery' })
    async confirmManualDelivery(
        @Param('driverId') driverId: string,
        @Param('parcelId') parcelId: string,
        @Body() body: {
            deliveryLocation?: string;
            deliveryNotes?: string;
        }
    ) {
        await this.driversService.confirmManualDelivery(
            driverId,
            parcelId,
            body.deliveryLocation,
            body.deliveryNotes
        );
        return { message: 'Delivery confirmed successfully' };
    }


}