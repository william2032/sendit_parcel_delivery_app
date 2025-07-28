import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../../generated/prisma';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        console.log('Required roles:', requiredRoles);

        if (!requiredRoles || requiredRoles.length === 0) {
            console.log('No roles required, allowing access');
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user as User;

        console.log('Authenticated user:', {
            id: user?.id,
            email: user?.email,
            role: user?.role
        });

        if (!user || !user.role) {
            console.log('No user or user role found');
            return false;
        }

        const hasRole = requiredRoles.includes(user.role);
        console.log('Has required role:', hasRole);
        console.log('Required:', requiredRoles, 'User has:', user.role);

        return hasRole;
    }
}
