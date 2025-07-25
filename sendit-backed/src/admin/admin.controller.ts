import { Controller } from '@nestjs/common';

@Controller('admin')
export class AdminController {
    // @ApiTags('admin/drivers')
    // @Controller('admin/drivers')
    // @ApiBearerAuth()
    // @UseGuards(AuthGuard('jwt'))
    // export class AdminDriversController {
    // constructor(private readonly driversService: DriversService) {}
    //
    // @Get(':driverId/location/current')
    // @ApiOperation({
    //     summary: 'Get driver current location (Admin)',
    //     description: 'Allows admins to view the current location of any driver',
    // })
    // @ApiParam({
    //     name: 'driverId',
    //     description: 'Driver ID',
    //     example: 'driver123',
    // })
    // @ApiResponse({
    //     status: HttpStatus.OK,
    //     description: 'Driver location retrieved successfully',
    //     type: DriverLocationResponseDto,
    // })
    // @ApiResponse({
    //     status: HttpStatus.FORBIDDEN,
    //     description: 'Admin access required',
    // })
    // async getDriverCurrentLocation(
    //     @User() user: { id: string; email: string; role: string },
    //     @Param('driverId') driverId: string,
    // ): Promise<DriverLocationI | null> {
    //     if (user.role !== 'ADMIN') {
    //         throw new BadRequestException('Admin access required');
    //     }
    //
    //     return this.driversService.getDriverCurrentLocation(driverId);
    // }
    //
    // @Get(':driverId/locations')
    // @ApiOperation({
    //     summary: 'Get driver location history (Admin)',
    //     description: 'Allows admins to view the location history of any driver',
    // })
    // @ApiParam({
    //     name: 'driverId',
    //     description: 'Driver ID',
    //     example: 'driver123',
    // })
    // @ApiResponse({
    //     status: HttpStatus.OK,
    //     description: 'Driver location history retrieved successfully',
    //     type: [DriverLocationResponseDto],
    // })
    // async getDriverLocationHistory(
    //     @Req() req: AuthenticatedRequest,
    //     @Param('driverId') driverId: string,
    // ): Promise<DriverLocationI[]> {
    //     const user = req.user;
    //     if (!user || user.role !== 'ADMIN') {
    //         throw new BadRequestException('Admin access required');
    //     }
    //
    //     return this.driversService.getDriverLocations(driverId);
    // }
}
