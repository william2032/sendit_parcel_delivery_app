import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../users/interfaces/auth.interface';
import { UserResponse } from '../../users/interfaces/user.interface';
import {AuthService} from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey:
                configService.get<string>('JWT_SECRET') ??
                (() => {
                    throw new Error('JWT_SECRET is not defined');
                })(),
        });
    }

    async validate(payload: JwtPayload): Promise<UserResponse> {
        // console.log('JWT Payload received:', payload);
        const user = await this.authService.verifyPayloadAndGetUser(payload);

        if (!user) {
            // console.log('User not found for payload.sub:', payload.sub);
            throw new UnauthorizedException('User not found');
        }
        console.log('Authenticated user:', {
            id: user.id,
            email: user.email,
            role: user.role,
        });

        return user;
    }
}
