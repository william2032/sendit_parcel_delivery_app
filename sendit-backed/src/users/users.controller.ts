import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    UseGuards,
    Query,
    ParseUUIDPipe,
    ValidationPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiBody,
} from '@nestjs/swagger';
import {RolesGuard} from "../auth/guards/roles.guards";
import {UsersService} from "./users.service";
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";
import {$Enums} from "../../generated/prisma";
import UserRole = $Enums.UserRole;
import {Roles} from "../auth/decorators/role-decorator";
import {CreateUserDto, UpdateUserDto} from "./dtos";
import {UserResponse} from "./interfaces/user.interface";


@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly userService: UsersService) {
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({summary: 'Create a new user'})
    @ApiBody({type: CreateUserDto})
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'User created successfully',
        type: UserResponse,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'User with email or phone already exists',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data',
    })
    async create(
        @Body(ValidationPipe) createUserDto: CreateUserDto,
    ): Promise<{
        success: boolean;
        message: string;
        data: UserResponse;
    }> {
        const user = await this.userService.create(createUserDto);
        return {
            success: true,
            message: 'User created successfully',
            data: user,
        };
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get all users'})
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Users retrieved successfully',
        type: [UserResponse],
    })
    async findAll(@Query('limit') limit?: string, @Query('offset') offset?: string): Promise<{
        success: boolean;
        message: string;
        data: UserResponse[];
        meta: {
            total: number;
            limit: number;
            offset: number;
        };
    }> {
        const users = await this.userService.findAll();

        // Apply pagination if parameters provided
        const limitNum = limit ? parseInt(limit, 10) : users.length;
        const offsetNum = offset ? parseInt(offset, 10) : 0;

        const paginatedUsers = users.slice(offsetNum, offsetNum + limitNum);

        return {
            success: true,
            message: 'Users retrieved successfully',
            data: paginatedUsers,
            meta: {
                total: users.length,
                limit: limitNum,
                offset: offsetNum,
            },
        };
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Get user by ID'})
    @ApiParam({
        name: 'id',
        description: 'User ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User retrieved successfully',
        type: UserResponse,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
    })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<{
        success: boolean;
        message: string;
        data: UserResponse;
    }> {
        const user = await this.userService.findOne(id);
        return {
            success: true,
            message: 'User retrieved successfully',
            data: user,
        };
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Update user'})
    @ApiParam({
        name: 'id',
        description: 'User ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiBody({type: UpdateUserDto})
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User updated successfully',
        type: UserResponse,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Email or phone already in use',
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    ): Promise<{
        success: boolean;
        message: string;
        data: UserResponse;
    }> {
        const user = await this.userService.update(id, updateUserDto);
        return {
            success: true,
            message: 'User updated successfully',
            data: user,
        };
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Delete user (soft delete)'})
    @ApiParam({
        name: 'id',
        description: 'User ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User deleted successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
    })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<{
        success: boolean;
        message: string;
    }> {
        await this.userService.remove(id);
        return {
            success: true,
            message: 'User deleted successfully',
        };
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Request password reset'})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: {
                    type: 'string',
                    format: 'email',
                    description: 'User email address',
                },
            },
            required: ['email'],
        },
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Password reset email sent',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
    })
    async resetPassword(
        @Body('email') email: string,
    ): Promise<{
        success: boolean;
        message: string;
    }> {
        await this.userService.resetPassword(email);
        return {
            success: true,
            message: 'Password reset instructions sent to your email',
        };
    }
}