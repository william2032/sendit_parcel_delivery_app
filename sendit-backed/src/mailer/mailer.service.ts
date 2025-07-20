import {Injectable, Logger} from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class MailerService {
    private readonly logger = new Logger(MailerService.name);

    constructor(
        private readonly mailerService: NestMailerService,
        private readonly configService: ConfigService,
    ) {
    }

    async sendWelcomeEmail(to: string, name: string): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to,
                subject: 'Welcome to SafariRentals AGENCY!',
                template: 'welcome-user',
                context: {
                    name,
                    appName: 'SafariRentals AGENCY',
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
                subject: 'Reset Your SafariRentals Account Password',
                template: 'reset-password',
                context: {
                    name,
                    resetUrl,
                    expiresIn,
                },
            });
            this.logger.log(`Verification email sent to ${to}`);
        } catch (error) {
            this.logger.error(
                `Failed to send verification email to ${to}`,
                error.stack,
            );
            throw error;
        }
    }
}
