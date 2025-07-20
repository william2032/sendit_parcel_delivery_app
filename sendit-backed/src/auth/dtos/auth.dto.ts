import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    MaxLength,
    IsOptional,
    IsBoolean,
    IsPhoneNumber, Matches, Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterUserDto {
    @ApiProperty({
        description: 'User full name',
        example: 'John Doe',
        minLength: 2,
        maxLength: 100,
    })
    @IsNotEmpty({ message: 'Name is required' })
    @IsString()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
    @Transform(({ value }) => value?.trim())
    name: string;

    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string;

    @ApiProperty({
        description: 'User phone number (mandatory)',
        example: '+254712345678',
    })
    @IsNotEmpty({ message: 'Phone number is required' })
    @IsString()
    @Transform(({ value }) => value?.trim())
    phone: string;

    @ApiProperty({
        description: 'User password',
        example: 'SecurePassword123!',
        minLength: 8,
    })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @ApiProperty({
        description: 'User city',
        example: 'Nairobi',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    city?: string;

    @ApiProperty({
        description: 'User country',
        example: 'Kenya',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    country?: string;

    @ApiProperty({
        description: 'Profile image URL',
        example: 'https://example.com/profile.jpg',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    profileImage?: string;

    @ApiProperty({
        description: 'Whether to send email verification (optional - user choice)',
        example: true,
        required: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    verifyEmail?: boolean = false;
}

export class LoginUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'SecurePassword123!',
    })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    password: string;
}



export class ForgotPasswordDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    @IsEmail({}, {message: 'Please provide a valid email address'})
    @IsNotEmpty({message: 'Email is required'})
    email: string;
}

export class ResetPasswordDto {
    @IsNotEmpty({message: 'Token is required'})
    @IsString()
    token: string;

    @IsNotEmpty({message: 'Password is required'})
    @MinLength(8, {message: 'Password must be at least 8 characters long'})
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
    password: string;

    @ApiProperty({
        description: 'Confirm new password',
    })
    @IsNotEmpty({message: 'Password confirmation is required'})
    confirmPassword: string;
}

export class SendOtpDto {
    @ApiProperty({
        description: 'Phone number to send OTP to (with country code)',
        example: '+254712345678',
    })
    @IsNotEmpty({message: 'Phone number is required'})
    @IsPhoneNumber('KE', {message: 'Please provide a valid Kenyan phone number'})
    phoneNumber: string;
}

export class VerifyOtpDto {
    @ApiProperty({
        description: 'Phone number that received the OTP',
        example: '+254712345678',
    })
    @IsNotEmpty({message: 'Phone number is required'})
    @IsPhoneNumber('KE', {message: 'Please provide a valid Kenyan phone number'})
    phoneNumber: string;

    @ApiProperty({
        description: '6-digit OTP code',
        example: '123456',
    })

    @IsNotEmpty({message: 'OTP code is required'})
    @IsString({message: 'OTP must be a string'})
    @Length(6, 6, {message: 'OTP must be exactly 6 digits'})
    @Matches(/^\d{6}$/, {message: 'OTP must contain only digits'})
    otp: string;

    @ApiProperty({
        description: 'Session ID from send OTP response',
        example: 'clxyz123abc',
    })
    @IsNotEmpty({message: 'Session ID is required'})
    @IsString({message: 'Session ID must be a string'})
    sessionId: string;
}

export class ResendOtpDto {
    @ApiProperty({
        description: 'Phone number to resend OTP to',
        example: '+254712345678',
    })
    @IsNotEmpty({message: 'Phone number is required'})
    @IsPhoneNumber('KE',{message: 'Please provide a valid Kenyan phone number'})
    phoneNumber: string;

    @ApiProperty({
        description: 'Previous session ID (optional)',
        example: 'clxyz123abc',
        required: false,
    })
    @IsString({message: 'Session ID must be a string'})
    sessionId?: string;
}

export class UserResponse {
    @ApiProperty({
        description: 'User ID',
        example: 'clxyz123abc'
    })
    id: string;

    @ApiProperty({
        description: 'User full name',
        example: 'John Doe'
    })
    name: string;

    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com'
    })
    email: string;

    @ApiProperty({
        description: 'User phone number',
        example: '+254712345678'
    })
    phone: string;

    @ApiProperty({
        description: 'User city',
        example: 'Nairobi',
        required: false
    })
    city?: string;

    @ApiProperty({
        description: 'User country',
        example: 'Kenya',
        required: false
    })
    country?: string;

    @ApiProperty({
        description: 'Profile image URL',
        example: 'https://example.com/profile.jpg',
        required: false
    })
    profileImage?: string;

    @ApiProperty({
        description: 'Email verification status',
        example: false
    })
    isEmailVerified: boolean;

    @ApiProperty({
        description: 'Phone verification status',
        example: true
    })
    isPhoneVerified: boolean;

    @ApiProperty({
        description: 'User role',
        example: 'user'
    })
    role: string;

    @ApiProperty({
        description: 'Account creation date',
        example: '2024-01-15T10:30:00Z'
    })
    createdAt: Date;
}

export class LoginClassResponse {
    @ApiProperty({
        description: 'Success message',
        example: 'Login successful'
    })
    message: string;

    @ApiProperty({
        description: 'User information',
        type: UserResponse
    })
    user: UserResponse;

    @ApiProperty({
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    access_token: string;

    @ApiProperty({
        description: 'Token type',
        example: 'Bearer'
    })
    token_type: string;

    @ApiProperty({
        description: 'Token expiration time in seconds',
        example: 3600
    })
    expires_in: number;
}

export class RegisterClassResponse {
    @ApiProperty({
        description: 'Success message',
        example: 'User registered successfully. Phone OTP sent for verification.'
    })
    message: string;

    @ApiProperty({
        description: 'User information',
        type: UserResponse
    })
    user: UserResponse;

    @ApiProperty({
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    access_token: string;

    @ApiProperty({
        description: 'Token type',
        example: 'Bearer'
    })
    token_type: string;

    @ApiProperty({
        description: 'Token expiration time in seconds',
        example: 3600
    })
    expires_in: number;
}