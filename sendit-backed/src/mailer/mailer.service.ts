import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
    private readonly logger = new Logger(MailerService.name);

    constructor(
        private readonly mailerService: NestMailerService,
        private readonly configService: ConfigService,
    ) {}

    async sendWelcomeEmail(to: string, name: string): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to,
                subject: 'Welcome to SendItCourier!',
                template: 'welcome-user',
                context: {
                    name,
                    appName: 'SendItCourier',
                    loginUrl: this.configService.get<string>('FRONTEND_LOGIN_URL'),
                },
            });
            this.logger.log(`Welcome email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send welcome email to ${to}`, error.stack);
            throw error;
        }
    }

    async sendVerificationEmail(
        to: string,
        name: string,
        resetToken: string,
        expiresIn: number,
    ): Promise<void> {
        try {
            const resetUrl = `${this.configService.get<string>('FRONTEND_RESET_URL')}?token=${resetToken}`;

            await this.mailerService.sendMail({
                to,
                subject: 'Reset Your SendItCourier Account Password',
                template: 'reset-password',
                context: {
                    name,
                    resetUrl,
                    expiresIn,
                    appName: 'SendItCourier',
                },
            });
            this.logger.log(`Password reset email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${to}`, error.stack);
            throw error;
        }
    }

    async sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to,
                subject: 'Verify Your SendItCourier Account Email',
                template: 'email-verification',
                context: {
                    name,
                    otp,
                    appName: 'SendItCourier',
                    expiresIn: 10, // OTP expires in 10 minutes
                },
            });
            this.logger.log(`OTP email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send OTP email to ${to}`, error.stack);
            throw error;
        }
    }

    async sendPasswordResetEmail(
        to: string,
        name: string,
        resetToken: string,
    ): Promise<void> {
        try {
            const resetUrl = `${this.configService.get<string>('FRONTEND_RESET_URL')}?token=${resetToken}`;
            const expiresIn = 60; // 1 hour in minutes

            await this.mailerService.sendMail({
                to,
                subject: 'Reset Your SendItCourier Account Password',
                template: 'reset-password',
                context: {
                    name,
                    resetUrl,
                    expiresIn,
                    appName: 'SendItCourier',
                },
            });
            this.logger.log(`Password reset email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${to}`, error.stack);
            throw error;
        }
    }
}
