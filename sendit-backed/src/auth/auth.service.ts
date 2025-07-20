import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import {ConfigService} from '@nestjs/config';
import {IAuthService, JwtPayload, LoginResponse, RegisterResponse} from 'src/users/interfaces/auth.interface';
import {PrismaService} from "../prisma/prisma.service";
import {UsersService} from "../users/users.service";
import {RegisterUserDto} from "../users/dtos";
import { randomUUID } from 'crypto';
import {UserResponse} from "../users/interfaces/user.interface";
import {LoginUserDto} from "./dtos/auth.dto";
import {PasswordResetService} from "./services/password-reset.service";
import {MailerService} from "../mailer/mailer.service";


@Injectable()
export class AuthService implements IAuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly passwordResetService: PasswordResetService,
        private mailerService: MailerService,

    ) {
    }

    async register(registerDto: RegisterUserDto): Promise<RegisterResponse> {
        // Validate phone number is provided (mandatory)
        if (!registerDto.phone || registerDto.phone.trim() === '') {
            throw new BadRequestException('Phone number is required');
        }

        // Check if user already exists
        const existingUser = await this.userService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Check if phone number already exists
        const existingPhone = await this.prisma.user.findFirst({
            where: {phone: registerDto.phone, deletedAt: null}
        });
        if (existingPhone) {
            throw new ConflictException('User with this phone number already exists');
        }

        try {
            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

            // Create user with email verification pending (user can choose to verify email or not)
            const user = await this.prisma.user.create({
                data: {
                    ...registerDto,
                    email: registerDto.email.toLowerCase(),
                    password: hashedPassword,
                    // Email verification is optional (user choice)
                    emailVerified: false,
                    // Phone verification starts as false but is mandatory before full access
                    phoneVerified: false,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    profileImage: true,
                    city: true,
                    country: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            //send email
            await this.mailerService.sendWelcomeEmail(user.email, user.name);

            // Generate email verification token if email verification is requested
            if (registerDto.verifyEmail) {
                const emailToken = this.generateVerificationToken();
                await this.prisma.user.update({
                    where: {id: user.id},
                    data: {emailVerifyToken: emailToken},
                });
                // Send email verification (implement email service)
                // await this.emailService.sendEmailVerification(user.email, emailToken);
            }

            // Generate phone verification OTP (mandatory)
            const phoneOtp = this.generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            await this.prisma.otpSession.create({
                data: {
                    userId: user.id,
                    otp: phoneOtp,
                    sessionId:  randomUUID(),
                    type: 'PHONE_VERIFICATION',
                    expiresAt: otpExpiresAt,
                    phoneNumber: registerDto.phone,
                },
            });

            // Send SMS with OTP (implement SMS service)
            // await this.smsService.sendOTP(registerDto.phone, phoneOtp);

            const userResponse = this.mapToUserResponse(user);
            const access_token = await this.generateJwtToken(userResponse);

            return {
                message: `Registration successful! ${registerDto.verifyEmail ? 'Please check your email and ' : ''}Please verify your phone number with the OTP sent to ${registerDto.phone}`,
                user: userResponse,
                access_token,
                token_type: 'Bearer',
                expires_in: 3600, // 1 hour
            };
        } catch (error) {
            if (error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Registration failed');
        }
    }

    async login(loginDto: LoginUserDto): Promise<LoginResponse> {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if phone is verified (mandatory)
        const fullUser = await this.userService.findByEmail(loginDto.email);
        if (!fullUser?.isPhoneVerified) {
            throw new UnauthorizedException('Please verify your phone number before logging in');
        }

        // Check if user is active
        const activeUser = await this.prisma.user.findFirst({
            where: {
                email: loginDto.email.toLowerCase(),
                isActive: true,
                deletedAt: null
            }
        });

        if (!activeUser) {
            throw new UnauthorizedException('Account is inactive');
        }

        const access_token = await this.generateJwtToken(user);

        return {
            message: 'Login successful',
            user,
            access_token,
            token_type: 'Bearer',
            expires_in: 3600, // 1 hour
        };
    }

    async validateUser(email: string, password: string): Promise<UserResponse | null> {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profilePicture: user.profilePicture,
            city: user.city,
            country: user.country,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async generateJwtToken(user: UserResponse): Promise<string> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return this.jwtService.sign(payload, {
            expiresIn: '1h',
            secret: this.configService.get<string>('JWT_SECRET'),
        });
    }

    async verifyToken(token: string): Promise<JwtPayload> {
        try {
            return this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    async verifyPayloadAndGetUser(payload: JwtPayload): Promise<UserResponse | null> {
        const user = await this.userService.findOne(payload.sub);

        if (!user) return null;

        return this.mapToUserResponse(user);
    }


    // Additional methods for verification
    async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
        const user = await this.prisma.user.findFirst({
            where: {
                emailVerifyToken: token,
                deletedAt: null,
            },
        });

        if (!user) {
            throw new NotFoundException('Invalid or expired verification token');
        }

        await this.prisma.user.update({
            where: {id: user.id},
            data: {
                emailVerified: true,
                emailVerifyToken: null,
            },
        });

        return {
            success: true,
            message: 'Email verified successfully',
        };
    }

    async verifyPhone(userId: string, otp: string): Promise<{ success: boolean; message: string }> {
        const otpSession = await this.prisma.otpSession.findFirst({
            where: {
                userId,
                otp,
                type: 'PHONE_VERIFICATION',
                verified : false,
                expiresAt: {
                    gte: new Date(),
                },
            },
        });

        if (!otpSession) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        // Mark OTP as verified
        await this.prisma.otpSession.update({
            where: {id: otpSession.id},
            data: {verified : true},
        });

        // Update user phone verification status
        await this.prisma.user.update({
            where: {id: userId},
            data: {phoneVerified: true},
        });

        return {
            success: true,
            message: 'Phone number verified successfully',
        };
    }
    async resetPassword(email: string): Promise<{ message: string }> {
        return this.passwordResetService.requestPasswordReset(email);
    }

    async resendPhoneOTP(userId: string): Promise<{ success: boolean; message: string }> {
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
        });

        if (!user || !user.phone) {
            throw new NotFoundException('User or phone number not found');
        }

        if (user.phoneVerified) {
            throw new BadRequestException('Phone number is already verified');
        }

        // Invalidate previous OTP sessions
        await this.prisma.otpSession.updateMany({
            where: {
                userId,
                type: 'PHONE_VERIFICATION',
                verified : false,
            },
            data: {verified : true},
        });

        // Generate new OTP
        const phoneOtp = this.generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await this.prisma.otpSession.create({
            data: {
                userId,
                otp: phoneOtp,
                sessionId:  randomUUID(),
                type: 'PHONE_VERIFICATION',
                expiresAt: otpExpiresAt,
                phoneNumber: user.phone,
            },
        });

        // Send SMS with new OTP
        // await this.smsService.sendOTP(user.phone, phoneOtp);

        return {
            success: true,
            message: 'New OTP sent to your phone number',
        };
    }

    // Helper methods
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

    private generateVerificationToken(): string {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15) +
            Date.now().toString(36);
    }

    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    }
}