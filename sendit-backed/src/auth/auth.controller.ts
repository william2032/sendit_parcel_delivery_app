import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    ValidationPipe,
    Get,
    Query,
    UseGuards,
    Request,
    UnauthorizedException,
    Param,
    BadRequestException, Req,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
    LoginClassResponse,
    LoginUserDto,
    RegisterClassResponse,
    RegisterUserDto,
    ResetPasswordDto
} from './dtos/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginResponse, RegisterResponse } from '../users/interfaces/auth.interface';
import { PasswordResetService } from './services/password-reset.service';
import {AuthGuard} from "@nestjs/passport";


interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role?: string;
    };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly passwordResetService: PasswordResetService,
    ) {}

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Register a new user',
        description: 'Register a new user. Email verification is required, phone verification is optional for future implementation.'
    })
    @ApiBody({ type: RegisterUserDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'User registered successfully. Email OTP sent for verification.',
        type: RegisterClassResponse,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'User with email already exists',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data',
    })
    async register(
        @Body(ValidationPipe) registerDto: RegisterUserDto,
    ): Promise<RegisterResponse> {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Login user',
        description: 'Login with email and password. Email verification is required for successful login.'
    })
    @ApiBody({ type: LoginUserDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Login successful',
        type: LoginClassResponse,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid credentials or email not verified',
    })
    async login(
        @Body(ValidationPipe) loginDto: LoginUserDto,
    ): Promise<LoginResponse> {
        return this.authService.login(loginDto);
    }

    @Post('verify-email')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Verify email address',
        description: 'Verify user email using the OTP sent via email and user ID'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                userId: {
                    type: 'string',
                    description: 'User ID from registration',
                },
                otp: {
                    type: 'string',
                    description: '6-digit OTP sent to the user’s email',
                    pattern: '^[0-9]{6}$',
                },
            },
            required: ['userId', 'otp'],
        },
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Email verified successfully',
        type: Object,
        schema: {
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid or expired OTP',
    })
    async verifyEmail(
        @Body() body: { userId: string, otp: string },
        @Req() req: AuthenticatedRequest,
    ): Promise<{
        success: boolean;
        message: string;
    }> {
        const email = req.user?.email;
        return this.authService.verifyEmail(body.otp, email, body.userId);
    }



    @Post('resend-email-otp')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Resend email verification OTP',
        description: 'Resend OTP for email verification'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'New OTP sent successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User or email not found',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Email is already verified',
    })
    async resendEmailOTP(
        @Request() req: any,
    ): Promise<{
        success: boolean;
        message: string;
    }> {
        const userId:string = req.user.id;
        console.log(userId);
        return this.authService.resendEmailOTP(userId);
    }

    @Post('verify-phone')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Verify phone number',
        description: 'Verify phone number using OTP. This is optional for future implementation.'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                otp: {
                    type: 'string',
                    description: '6-digit OTP sent to phone',
                    pattern: '^[0-9]{6}$',
                },
            },
            required: ['otp'],
        },
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Phone verified successfully',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid or expired OTP',
    })
    async verifyPhone(
        @Request() req: any,
        @Body('otp') otp: string,
    ): Promise<{
        success: boolean;
        message: string;
    }> {
        const userId = req.user.sub;
        return this.authService.verifyPhone(userId, otp);
    }

    @Post('resend-phone-otp')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Resend phone verification OTP',
        description: 'Resend OTP for phone verification'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'New OTP sent successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User or phone number not found',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Phone number is already verified',
    })
    async resendPhoneOTP(
        @Request() req: any,
    ): Promise<{
        success: boolean;
        message: string;
    }> {
        const userId = req.user.sub;
        return this.authService.resendPhoneOTP(userId);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Request password reset',
        description: 'Send password reset instructions to user email'
    })
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
    async forgotPassword(
        @Body('email') email: string,
    ): Promise<{
        success: boolean;
        message: string;
    }> {
        await this.authService.resetPassword(email);
        return {
            success: true,
            message: 'Password reset instructions sent to your email',
        };
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password with token' })
    @ApiResponse({ status: 200, description: 'Password reset successfully' })
    @ApiResponse({ status: 400, description: 'Invalid token or password' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.passwordResetService.resetPassword(
            dto.token,
            dto.password,
            dto.confirmPassword,
        );
    }

    @Get('verify-reset-token/:token')
    @ApiOperation({ summary: 'Verify if reset token is valid' })
    @ApiResponse({ status: 200, description: 'Token validation result' })
    async verifyResetToken(@Param('token') token: string) {
        return this.passwordResetService.verifyResetToken(token);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get current user profile',
        description: 'Get authenticated user profile information'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Profile retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid or expired token',
    })
    async getProfile(
        @Request() req: any,
    ): Promise<{
        success: boolean;
        message: string;
        data: any;
    }> {
        const userId = req.user.sub;
        const user = await this.authService.verifyPayloadAndGetUser(req.user);

        return {
            success: true,
            message: 'Profile retrieved successfully',
            data: user,
        };
    }

    @Post('refresh-token')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Refresh access token',
        description: 'Generate a new access token using the current valid token'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Token refreshed successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid or expired token',
    })
    async refreshToken(
        @Request() req: any,
    ): Promise<{
        success: boolean;
        message: string;
        access_token: string;
        token_type: string;
        expires_in: number;
    }> {
        const user = await this.authService.verifyPayloadAndGetUser(req.user);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const access_token = await this.authService.generateJwtToken(user);

        return {
            success: true,
            message: 'Token refreshed successfully',
            access_token,
            token_type: 'Bearer',
            expires_in: 3600,
        };
    }
}