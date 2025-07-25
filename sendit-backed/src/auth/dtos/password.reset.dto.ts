import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Password reset token',
        example: 'abc123def456...',
    })
    @IsNotEmpty({ message: 'Token is required' })
    @IsString()
    token: string;

    @ApiProperty({
        description: 'New password',
        example: 'NewSecurePassword123!',
        minLength: 8,
    })
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
    newPassword: string;

    @ApiProperty({
        description: 'Confirm new password',
        example: 'NewSecurePassword123!',
    })
    @IsNotEmpty({ message: 'Password confirmation is required' })
    confirmPassword: string;
}

export class VerifyResetTokenDto {
    @ApiProperty({
        description: 'Password reset token to verify',
        example: 'abc123def456...',
    })
    @IsNotEmpty({ message: 'Token is required' })
    @IsString()
    token: string;
}