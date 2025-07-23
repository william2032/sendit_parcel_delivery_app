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
import {$Enums} from "../../generated/prisma";
import UserRole = $Enums.UserRole;

@Injectable()
export class AuthService implements IAuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly passwordResetService: PasswordResetService,
        private readonly mailerService: MailerService,
    ) {}

    async register(registerDto: RegisterUserDto): Promise<RegisterResponse> {
        // Keep phone number optional for future implementation
        // if (!registerDto.phone || registerDto.phone.trim() === '') {
        //     throw new BadRequestException('Phone number is required');
        // }

        // Check if user already exists
        const existingUser = await this.userService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Keep phone number check for future implementation
        // const existingPhone = await this.prisma.user.findFirst({
        //     where: {phone: registerDto.phone, deletedAt: null}
        // });
        // if (existingPhone) {
        //     throw new ConflictException('User with this phone number already exists');
        // }

        try {
            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

            // Create user with email verification pending
            const user = await this.prisma.user.create({
                data: {
                    name: registerDto.name,
                    email: registerDto.email.toLowerCase(),
                    phone: registerDto.phone,
                    password: hashedPassword,
                    city: registerDto.city || null,
                    country: registerDto.country || null,
                    profileImage: null,
                    role: registerDto.role || UserRole.CUSTOMER,
                    isActive: true,
                    emailVerified: false,
                    phoneVerified: false,
                    emailVerifyToken: null,
                    resetTokenExpiresAt: null,
                    deletedAt: null,
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

            // Send welcome email
            await this.mailerService.sendWelcomeEmail(user.email, user.name);

            // Generate email verification OTP
            const emailOtp = this.generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            await this.prisma.otpSession.create({
                data: {
                    userId: user.id,
                    otp: emailOtp,
                    sessionId: randomUUID(),
                    type: 'EMAIL_VERIFICATION',
                    expiresAt: otpExpiresAt,
                    email: registerDto.email,
                },
            });

            await this.mailerService.sendOtpEmail(user.email, user.name, emailOtp);

            // Keep phone OTP code for future implementation
            /*
            const phoneOtp = this.generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            await this.prisma.otpSession.create({
                data: {
                    userId: user.id,
                    otp: phoneOtp,
                    sessionId: randomUUID(),
                    type: 'PHONE_VERIFICATION',
                    expiresAt: otpExpiresAt,
                    phoneNumber: registerDto.phone,
                },
            });
            // await this.smsService.sendOTP(registerDto.phone, phoneOtp);
            */

            const userResponse = this.mapToUserResponse(user);
            const access_token = await this.generateJwtToken(userResponse);

            return {
                message: `Registration successful! Please verify your email with the OTP sent to ${registerDto.email}`,
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

        // Check if email is verified - FIXED: Use correct property name
        const fullUser = await this.userService.findByEmail(loginDto.email);
        if (!fullUser?.emailVerified) {
            throw new UnauthorizedException('Please verify your email before logging in');
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

        return this.mapToUserResponse(user);
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

    async verifyEmail(otp: string, email?: string): Promise<{ success: boolean; message: string }> {
        try {
            console.log('Verifying email with OTP:', otp, 'and email:', email); // Debug log

            if (!otp) {
                throw new BadRequestException('OTP is required');
            }

            const otpSession = await this.prisma.otpSession.findFirst({
                where: {
                    otp,
                    ...(email ? { email } : {}),
                    type: 'EMAIL_VERIFICATION',
                    verified: false,
                    expiresAt: {
                        gte: new Date(),
                    },
                },
                include: {
                    user: true, // Include user to get userId
                },
            });

            console.log('OTP Session:', otpSession); // Debug log

            if (!otpSession) {
                return {
                    success: false,
                    message: 'Invalid or expired OTP.',
                };
            }

            if (!otpSession.userId) {
                return {
                    success: false,
                    message: 'No user associated with this OTP session.',
                };
            }

            await this.prisma.otpSession.update({
                where: { id: otpSession.id },
                data: { verified: true },
            });

            await this.prisma.user.update({
                where: { id: otpSession.userId },
                data: { emailVerified: true },
            });

            return {
                success: true,
                message: 'Email successfully verified!',
            };
        } catch (err) {
            console.error('Email verification error:', {
                message: err.message,
                name: err.name,
                stack: err.stack,
            }); // Debug log
            if (err instanceof BadRequestException) {
                return {
                    success: false,
                    message: err.message,
                };
            }
            return {
                success: false,
                message: 'Email verification failed.',
            };
        }
    }


    async verifyPhone(userId: string, otp: string): Promise<{ success: boolean; message: string }> {
        const otpSession = await this.prisma.otpSession.findFirst({
            where: {
                userId,
                otp,
                type: 'PHONE_VERIFICATION',
                verified: false,
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
            where: { id: otpSession.id },
            data: { verified: true },
        });

        // Update user phone verification status
        await this.prisma.user.update({
            where: { id: userId },
            data: { phoneVerified: true },
        });

        return {
            success: true,
            message: 'Phone number verified successfully',
        };
    }

    async resetPassword(email: string): Promise<{ message: string }> {
        return this.passwordResetService.requestPasswordReset(email);
    }

    async resendEmailOTP(userId: string): Promise<{ success: boolean; message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.email) {
            throw new NotFoundException('User or email not found');
        }

        if (user.emailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        // Invalidate previous OTP sessions
        await this.prisma.otpSession.updateMany({
            where: {
                userId,
                type: 'EMAIL_VERIFICATION',
                verified: false,
            },
            data: { verified: true },
        });

        // Generate new OTP
        const emailOtp = this.generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await this.prisma.otpSession.create({
            data: {
                userId,
                otp: emailOtp,
                sessionId: randomUUID(),
                type: 'EMAIL_VERIFICATION',
                expiresAt: otpExpiresAt,
                email: user.email,
            },
        });

        // Send email with new OTP - FIXED: Pass user name
        await this.mailerService.sendOtpEmail(user.email, user.name, emailOtp);

        return {
            success: true,
            message: 'New OTP sent to your email',
        };
    }

    async resendPhoneOTP(userId: string): Promise<{ success: boolean; message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
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
                verified: false,
            },
            data: { verified: true },
        });

        // Generate new OTP
        const phoneOtp = this.generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await this.prisma.otpSession.create({
            data: {
                userId,
                otp: phoneOtp,
                sessionId: randomUUID(),
                type: 'PHONE_VERIFICATION',
                expiresAt: otpExpiresAt,
                phoneNumber: user.phone,
                email: user.email,
            },
        });

        // Send SMS with new OTP
        // await this.smsService.sendOTP(user.phone, phoneOtp);

        return {
            success: true,
            message: 'New OTP sent to your phone number',
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

    private generateVerificationToken(): string {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15) +
            Date.now().toString(36);
    }

    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    }
}