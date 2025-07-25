import { UserResponse } from './user.interface';
import { RegisterUserDto } from '../dtos';
import {LoginUserDto} from "../../auth/dtos/auth.dto";

export interface JwtPayload {
    sub: string; // user id
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

export interface LoginResponse {
    message: string;
    user: UserResponse;
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface RegisterResponse {
    message: string;
    user: UserResponse;
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface IAuthService {
    register(registerDto: RegisterUserDto): Promise<RegisterResponse>;

    login(loginDto: LoginUserDto): Promise<LoginResponse>;

    validateUser(email: string, password: string): Promise<UserResponse | null>;

    generateJwtToken(user: UserResponse): Promise<string>;

    verifyToken(token: string): Promise<JwtPayload>;
}
