import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {IuserService, User, UserResponse} from "./interfaces/user.interface";
import {CreateUserDto, UpdateUserDto} from "./dtos";
import {PrismaService} from "../prisma/prisma.service";
import {Prisma} from "../../generated/prisma";

@Injectable()
export class UsersService implements IuserService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateUserDto): Promise<UserResponse> {
        try {
            // Check if user already exists
            const existingUser = await this.findByEmail(dto.email);
            if (existingUser) {
                throw new ConflictException('User with this email already exists');
            }

            // Check if phone number already exists (if provided)
            if (dto.phone) {
                const existingPhone = await this.prisma.user.findFirst({
                    where: { phone: dto.phone, deletedAt: null }
                });
                if (existingPhone) {
                    throw new ConflictException('User with this phone number already exists');
                }
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

            // Create user
            const user = await this.prisma.user.create({
                data: {
                    ...dto,
                    password: hashedPassword,
                },
                select: this.getUserSelectFields(),
            });

            return this.mapToUserResponse(user);
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('User with this email or phone already exists');
                }
            }
            throw error;
        }
    }

    async findAll(): Promise<UserResponse[]> {
        const users = await this.prisma.user.findMany({
            where: { deletedAt: null },
            select: this.getUserSelectFields(),
            orderBy: { createdAt: 'desc' },
        });

        return users.map(user => this.mapToUserResponse(user));
    }

    async findOne(id: string): Promise<UserResponse> {
        const user = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
            select: this.getUserSelectFields(),
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return this.mapToUserResponse(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findFirst({
            where: {
                email: email.toLowerCase(),
                deletedAt: null
            },
        });

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            phone: user.phone || '',
            profilePicture: user.profileImage,
            city: user.city,
            country: user.country,
            isEmailVerified: user.emailVerified,
            isPhoneVerified: user.phoneVerified,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponse> {
        // Check if user exists
        const existingUser = await this.findOne(id);

        // If email is being updated, check for conflicts
        if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
            const emailExists = await this.findByEmail(updateUserDto.email);
            if (emailExists) {
                throw new ConflictException('Email already in use by another user');
            }
        }

        // If phone is being updated, check for conflicts
        if (updateUserDto.phone && updateUserDto.phone !== existingUser.phone) {
            const phoneExists = await this.prisma.user.findFirst({
                where: {
                    phone: updateUserDto.phone,
                    deletedAt: null,
                    NOT: { id }
                }
            });
            if (phoneExists) {
                throw new ConflictException('Phone number already in use by another user');
            }
        }

        // Hash password if provided
        const updateData: any = { ...updateUserDto };
        if (updateUserDto.password) {
            const saltRounds = 12;
            updateData.password = await bcrypt.hash(updateUserDto.password, saltRounds);
        }

        try {
            const updatedUser = await this.prisma.user.update({
                where: { id },
                data: updateData,
                select: this.getUserSelectFields(),
            });

            return this.mapToUserResponse(updatedUser);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('Email or phone number already in use');
                }
                if (error.code === 'P2025') {
                    throw new NotFoundException(`User with ID ${id} not found`);
                }
            }
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        // Check if user exists
        await this.findOne(id);

        try {
            // Soft delete
            await this.prisma.user.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`User with ID ${id} not found`);
                }
            }
            throw error;
        }
    }

    async resetPassword(email: string): Promise<void> {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User with this email does not exist');
        }

        // Generate reset token (you can implement token generation logic here)
        const resetToken = this.generateResetToken();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetTokenExpiresAt: expiresAt,
            },
        });

        await this.prisma.passwordResetToken.create({
            data: {
                token: resetToken,
                userId: user.id,
                expiresAt,
            },
        });

        // Here you would typically send an email with the reset token
        // await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    }

    // Helper methods
    private getUserSelectFields() {
        return {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            city: true,
            country: true,
            emailVerified: true,
            phoneVerified: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        };
    }

    private mapToUserResponse(user: any): UserResponse {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            profilePicture: user.profileImage,
            city: user.city,
            country: user.country,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    private generateResetToken(): string {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
}