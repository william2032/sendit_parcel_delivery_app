import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpStatus,
    ParseUUIDPipe,
    ValidationPipe,
    UsePipes,
    NotFoundException, Req
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { UserRole } from 'generated/prisma';
import {
    AdminCreateParcelDto,
    SenderSearchDto,
    DriverSearchDto,
    BulkDriverAssignmentDto,
    AdminParcelQueryDto,
    UpdateParcelStatusDto
} from './dtos/admin.dto';

import {
    SenderSearchResult,
    AvailableDriver,
    AdminParcelResponse,
    AdminDashboardStats
} from './interfaces/admin.interface';

import { PaginatedResponse } from '../parcels/interfaces/parcel.interface';
import {RolesGuard} from "../auth/guards/roles.guards";
import {Roles} from "../auth/decorators/role-decorator";
import {
    AdminDashboardStatsResponse, AdminParcelResponseClass,
    AvailableDriverResponse,
    SenderSearchResponse
} from "./dtos/admin-response.dto";

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('dashboard/stats')
    @ApiOperation({ summary: 'Get admin dashboard statistics' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Dashboard statistics retrieved successfully',
        type: AdminDashboardStatsResponse
    })
    async getDashboardStats(): Promise<AdminDashboardStats> {
        return this.adminService.getDashboardStats();
    }

    @Get('senders/search')
    @ApiOperation({ summary: 'Search for senders by name, email, or phone' })
    @ApiQuery({ name: 'query', description: 'Search query string' })
    @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Senders found successfully',
        type: [SenderSearchResponse]
    })
    @UsePipes(new ValidationPipe({ transform: true }))
    async searchSenders(@Query() searchDto: SenderSearchDto): Promise<SenderSearchResult[]> {
        return this.adminService.searchSenders(searchDto);
    }

    @Get('senders/:senderId')
    @ApiOperation({ summary: 'Get detailed information about a specific sender' })
    @ApiParam({ name: 'senderId', description: 'Sender ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Sender details retrieved successfully',
        type: SenderSearchResponse
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Sender not found'
    })
    async getSenderDetails(
        @Param('senderId', ParseUUIDPipe) senderId: string
    ): Promise<SenderSearchResult> {
        return this.adminService.getSenderDetails(senderId);
    }

    @Get('drivers/available')
    @ApiOperation({ summary: 'Search for available drivers' })
    @ApiQuery({ name: 'city', description: 'City to search in', required: false })
    @ApiQuery({ name: 'lat', description: 'Latitude for location-based search', required: false })
    @ApiQuery({ name: 'lng', description: 'Longitude for location-based search', required: false })
    @ApiQuery({ name: 'radius', description: 'Search radius in km', required: false })
    @ApiQuery({ name: 'onlineOnly', description: 'Only return online drivers', required: false })
    @ApiQuery({ name: 'maxAssignedParcels', description: 'Maximum assigned parcels per driver', required: false })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Available drivers retrieved successfully',
        type: [AvailableDriverResponse]
    })
    @UsePipes(new ValidationPipe({ transform: true }))
    async searchAvailableDrivers(@Query() searchDto: DriverSearchDto): Promise<AvailableDriver[]> {
        return this.adminService.searchAvailableDrivers(searchDto);
    }

    @Post('parcels')
    @ApiOperation({ summary: 'Create a new parcel as admin' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Parcel created successfully',
        type:  AdminParcelResponseClass
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data'
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Only admins can create parcels on behalf of users'
    })
    @UsePipes(new ValidationPipe({ transform: true }))
    async createParcel(
        @Req() req,
        @Body() createParcelDto: AdminCreateParcelDto
    ): Promise<AdminParcelResponse> {
        return this.adminService.createParcel(req.user.id, createParcelDto);
    }

    @Get('parcels')
    @ApiOperation({ summary: 'Get all parcels with admin view and filtering' })
    @ApiQuery({ name: 'page', description: 'Page number', required: false })
    @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
    @ApiQuery({ name: 'status', description: 'Filter by parcel status', required: false })
    @ApiQuery({ name: 'driverId', description: 'Filter by driver ID', required: false })
    @ApiQuery({ name: 'senderId', description: 'Filter by sender ID', required: false })
    @ApiQuery({ name: 'trackingNumber', description: 'Filter by tracking number', required: false })
    @ApiQuery({ name: 'dateFrom', description: 'Filter from date (ISO string)', required: false })
    @ApiQuery({ name: 'dateTo', description: 'Filter to date (ISO string)', required: false })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Parcels retrieved successfully'
    })
    @UsePipes(new ValidationPipe({ transform: true }))
    async getAllParcels(
        @Query() query: AdminParcelQueryDto
    ): Promise<PaginatedResponse<AdminParcelResponse>> {
        return this.adminService.getAllParcels(query);
    }

    @Put('parcels/:parcelId/status')
    @ApiOperation({ summary: 'Update parcel status with admin privileges' })
    @ApiParam({ name: 'parcelId', description: 'Parcel ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Parcel status updated successfully',
        type: AdminParcelResponseClass
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Parcel not found'
    })
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateParcelStatus(
        @Param('parcelId', ParseUUIDPipe) parcelId: string,
        @Body() updateStatusDto: UpdateParcelStatusDto,
        @Req() req
    ): Promise<AdminParcelResponse> {
        return this.adminService.updateParcelStatus(parcelId, updateStatusDto, req.user.id);
    }

    @Post('parcels/bulk-assign-driver')
    @ApiOperation({ summary: 'Bulk assign driver to multiple parcels' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Driver assigned to parcels successfully',
        type: [AdminParcelResponseClass]
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Driver not found or not available'
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid parcel IDs or driver assignment data'
    })
    @UsePipes(new ValidationPipe({ transform: true }))
    async bulkAssignDriver(
        @Body() assignmentDto: BulkDriverAssignmentDto
    ): Promise<AdminParcelResponse[]> {
        return this.adminService.bulkAssignDriver(assignmentDto);
    }

    @Get('parcels/:parcelId')
    @ApiOperation({ summary: 'Get detailed parcel information by ID' })
    @ApiParam({ name: 'parcelId', description: 'Parcel ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Parcel details retrieved successfully',
        type: AdminParcelResponseClass
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Parcel not found'
    })
    async getParcelById(
        @Param('parcelId', ParseUUIDPipe) parcelId: string
    ): Promise<AdminParcelResponse> {
        return this.adminService.getParcelById(parcelId);
    }

    @Get('stats/parcels-by-status')
    @ApiOperation({ summary: 'Get parcel count by status' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Parcel statistics by status retrieved successfully'
    })
    async getParcelsByStatus() {
        // This could use a dedicated service method for more detailed statistics
        const stats = await this.adminService.getDashboardStats();
        return {
            pending: stats.pendingParcels,
            inTransit: stats.inTransitParcels,
            delivered: stats.deliveredToday,
            total: stats.totalParcels
        };
    }

    @Get('stats/revenue')
    @ApiOperation({ summary: 'Get revenue statistics' })
    @ApiQuery({ name: 'period', description: 'Period: daily, weekly, monthly, yearly', required: false })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Revenue statistics retrieved successfully'
    })
    async getRevenueStats(@Query('period') period: string = 'monthly') {
        // This would need a dedicated service method for more detailed revenue analysis
        const stats = await this.adminService.getDashboardStats();
        return {
            totalRevenue: stats.totalRevenue,
            period,
        };
    }
}