import {CreateUserDto, UpdateUserDto} from '../dtos';
import {ApiProperty} from "@nestjs/swagger";
import {$Enums} from "../../../generated/prisma";
import UserRole = $Enums.UserRole;


export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    profilePicture: string | null;
    city: string | null;
    country: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export class UserResponse {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    phone: string;

    @ApiProperty({ nullable: true })
    profilePicture: string | null;

    @ApiProperty({ nullable: true })
    city: string | null;

    @ApiProperty({ nullable: true })
    country: string | null;

    @ApiProperty({ enum: UserRole })
    role: UserRole;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    isActive: boolean;
}


export interface IuserService {
    create(dto: CreateUserDto): Promise<UserResponse>;

    findAll(): Promise<UserResponse[]>;

    findOne(id: string): Promise<UserResponse>;

    findByEmail(email: string): Promise<User | null>;

    update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponse>;

    remove(id: string): Promise<void>;

    resetPassword(email: string): Promise<void>;
}
