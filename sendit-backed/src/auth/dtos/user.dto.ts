import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    MaxLength,
    IsOptional,
    IsBoolean,
    IsPhoneNumber,
} from 'class-validator';
import {Transform} from "class-transformer";

export class CreateUserDto {
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
        description: 'User phone number',
        example: '+254712345678',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    phone?: string;

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
}

export class UpdateUserDto {
    @ApiProperty({
        description: 'User full name',
        example: 'John Doe',
        minLength: 2,
        maxLength: 100,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
    @Transform(({ value }) => value?.trim())
    name?: string;

    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
        required: false,
    })
    @IsOptional()
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email?: string;

    @ApiProperty({
        description: 'User phone number',
        example: '+254712345678',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    phone?: string;

    @ApiProperty({
        description: 'User password',
        example: 'SecurePassword123!',
        minLength: 8,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password?: string;

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
}