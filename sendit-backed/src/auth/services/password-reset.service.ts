import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { MailerService } from '../../mailer/mailer.service';

@Injectable()
export class PasswordResetService {
    constructor(
        private prisma: PrismaService,
        private mailerService: MailerService,
    ) {}

    async requestPasswordReset(email: string): Promise<{ message: string }> {
        try {
            // Find user by email
            const user = await this.prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });

            // Always return success message for security
            const successMessage =
                'If an account with that email exists, a password reset link has been sent.';
            if (!user) {
                return { message: successMessage };
            }
            // Invalidate any existing reset tokens for this user
            await this.prisma.passwordResetToken.updateMany({
                where: {
                    userId: user.id,
                    used: false,
                    expiresAt: { gt: new Date() },
                },
                data: { used: true },
            });
            //send verification email

            // Generate secure token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            // Create reset token record with 10-minute expiration
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await this.prisma.passwordResetToken.create({
                data: {
                    token: hashedToken,
                    userId: user.id,
                    expiresAt,
                },
            });

            await this.mailerService.sendVerificationEmail(
                user.email,
                user.name,
                resetToken,
                10,
            );

            return { message: successMessage };
        } catch (error) {
            throw new BadRequestException('Failed to process password reset request');
        }
    }

    async resetPassword(
        token: string,
        newPassword: string,
        confirmPassword: string,
    ): Promise<{ message: string }> {
        // Validate passwords match
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        // Hash the provided token
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find valid reset token
        const resetToken = await this.prisma.passwordResetToken.findFirst({
            where: {
                token: hashedToken,
                used: false,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });

        if (!resetToken) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        //hash password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { used: true },
            }),
        ]);

        return { message: 'Password has been reset successfully' };
    }

    async verifyResetToken(
        token: string,
    ): Promise<{ valid: boolean; message: string }> {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetToken = await this.prisma.passwordResetToken.findFirst({
            where: {
                token: hashedToken,
                used: false,
                expiresAt: { gt: new Date() },
            },
        });

        if (!resetToken) {
            return {
                valid: false,
                message: 'Invalid or expired reset token',
            };
        }
        return {
            valid: true,
            message: 'Token is valid',
        };
    }
}
