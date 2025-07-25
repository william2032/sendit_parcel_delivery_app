import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {ParcelsService} from "./parcels.service";
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
    AssignDriverDto,
    CoordinatesDto,
    CreateParcelDto,
    CreateTrackingEventDto,
    ParcelQueryDto,
    UpdateParcelDto
} from "./dtos";
import { ParcelStatus, WeightCategory, TrackingEventType } from 'generated/prisma';
import {PaginatedResponse, ParcelI, TrackingEventI} from "./interfaces/parcel.interface";
@ApiTags('parcels')
@Controller('parcels')
@UseGuards(JwtAuthGuard)
export class ParcelsController {
    constructor(private readonly parcelService: ParcelsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new parcel' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Parcel created successfully' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
    async create(@Body() createParcelDto: CreateParcelDto): Promise<ParcelI> {
        return this.parcelService.create(createParcelDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all parcels with pagination and filtering' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Parcels retrieved successfully' })
    async findAll(@Query() query: ParcelQueryDto): Promise<PaginatedResponse<ParcelI>> {
        return this.parcelService.findAll(query);
    }

    @Get('tracking/:trackingNumber')
    @ApiOperation({ summary: 'Get parcel by tracking number' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Parcel found' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Parcel not found' })
    async findByTrackingNumber(@Param('trackingNumber') trackingNumber: string): Promise<ParcelI> {
        return this.parcelService.findByTrackingNumber(trackingNumber);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get parcel by ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Parcel found' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Parcel not found' })
    async findOne(@Param('id') id: string): Promise<ParcelI> {
        return this.parcelService.findOne(id);
    }
    @Get('sent/:userId')
    @ApiOperation({ summary: 'Get parcels sent by a specific user' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Sent parcels retrieved successfully' })
    async getSentParcels(
        @Param('userId') userId: string,
        @Query() query: ParcelQueryDto
    ): Promise<PaginatedResponse<ParcelI>> {
        return this.parcelService.findAll({ ...query, senderId: userId });
    }

    @Get('received/:userId')
    @ApiOperation({ summary: 'Get parcels received by a specific user' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Received parcels retrieved successfully' })
    async getReceivedParcels(
        @Param('userId') userId: string,
        @Query() query: ParcelQueryDto
    ): Promise<PaginatedResponse<ParcelI>> {
        return this.parcelService.findAll({ ...query, receiverId: userId });
    }


    @Patch(':id')
    @ApiOperation({ summary: 'Update parcel' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Parcel updated successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Parcel not found' })
    async update(
        @Param('id') id: string,
        @Body() updateParcelDto: UpdateParcelDto
    ): Promise<ParcelI> {
        return this.parcelService.update(id, updateParcelDto);
    }

    @Patch(':id/assign-driver')
    @ApiOperation({ summary: 'Assign driver to parcel' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Driver assigned successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Parcel not found' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Driver already assigned' })
    async assignDriver(
        @Param('id') id: string,
        @Body() assignDriverDto: AssignDriverDto
    ): Promise<ParcelI> {
        return this.parcelService.assignDriver(id, assignDriverDto);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update parcel status' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Status updated successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Parcel not found' })
    async updateStatus(
        @Param('id') id: string,
        @Body() body: {
            status: ParcelStatus;
            location?: string;
            coordinates?: CoordinatesDto
        }
    ): Promise<ParcelI> {
        return this.parcelService.updateStatus(id, body.status, body.location, body.coordinates);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete parcel' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Parcel deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Parcel not found' })
    async remove(@Param('id') id: string): Promise<void> {
        return this.parcelService.remove(id);
    }

    @Post(':id/tracking-events')
    @ApiOperation({ summary: 'Create tracking event for parcel' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Tracking event created successfully' })
    async createTrackingEvent(@Body() createTrackingEventDto: CreateTrackingEventDto): Promise<TrackingEventI> {
        return this.parcelService.createTrackingEvent(createTrackingEventDto);
    }

    @Get(':id/tracking-events')
    @ApiOperation({ summary: 'Get tracking events for parcel' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Tracking events retrieved successfully' })
    async getTrackingEvents(@Param('id') id: string): Promise<TrackingEventI[]> {
        return this.parcelService.getTrackingEvents(id);
    }
}