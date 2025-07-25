import {
    IsEmail,
    IsString,
    MinLength,
    IsOptional,
    IsEnum,
    Matches, IsBoolean,
} from 'class-validator';
import {$Enums} from '../../../generated/prisma';
import UserRole = $Enums.UserRole;

export class RegisterUserDto {
    @IsEmail({}, {message: 'Please provide a valid email address'})
    email: string;

    @IsString({message: 'Password must be a string'})
    @MinLength(8, {message: 'Password must be at least 8 characters long'})
    password: string;

    @IsString({message: 'Name must be a string'})
    @MinLength(3, {message: 'Name must be at least 3 characters long'})
    name: string;

    @IsString({message: 'Phone number must be a string'})
    @Matches(/^\+?[0-9]{7,15}$/, {
        message: 'Phone number must be valid (7–15 digits, optional + prefix)',
    })
    phone: string;

    @IsOptional() // Role is optional, defaults to CUSTOMER
    @IsEnum(UserRole, {message: 'Role must be either ADMIN or CUSTOMER'})
    role?: UserRole;

    @IsOptional()
    @IsString({message: 'City must be a string'})
    city?: string;

    @IsOptional()
    @IsString({message: 'Country must be a string'})
    country?: string;

}
