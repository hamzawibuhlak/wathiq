import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SuperAdminDashboardGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.replace('Bearer ', '');
        if (!token) throw new ForbiddenException('غير مصرح — يرجى تسجيل الدخول');

        try {
            const payload = this.jwtService.verify(token, {
                secret: process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET,
            });

            if (payload.type !== 'SUPER_ADMIN') {
                throw new ForbiddenException('هذه الصفحة للإدارة فقط');
            }

            const requiredRole = this.reflector.get<string>('superAdminRole', context.getHandler());
            if (requiredRole && payload.role !== 'OWNER' && payload.role !== requiredRole) {
                throw new ForbiddenException('صلاحياتك لا تكفي لهذا الإجراء');
            }

            request.superAdmin = payload;
            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) throw error;
            throw new ForbiddenException('الجلسة منتهية — يرجى تسجيل الدخول مجدداً');
        }
    }
}
