import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
    TENANT_PERMISSION_KEY,
    TenantPermissionMeta,
} from '../decorators/require-tenant-permission.decorator';
import { TenantPermissionService } from '../tenant-permission.service';
import { AccessLevel } from '@prisma/client';

/**
 * Guard that checks tenant-level RBAC permissions.
 * Use with @RequireTenantPermission() decorator.
 * Falls back to allowing OWNER/SUPER_ADMIN roles.
 */
@Injectable()
export class TenantPermissionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private permissionService: TenantPermissionService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermission =
            this.reflector.getAllAndOverride<TenantPermissionMeta>(
                TENANT_PERMISSION_KEY,
                [context.getHandler(), context.getClass()],
            );

        // No permission required = allow
        if (!requiredPermission) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('المستخدم غير مصادق عليه');
        }

        const hasPermission = await this.permissionService.checkPermission(
            user.userId,
            user.tenantId,
            requiredPermission.resource,
            requiredPermission.action,
            requiredPermission.level as AccessLevel,
        );

        if (!hasPermission) {
            throw new ForbiddenException('ليس لديك صلاحية لتنفيذ هذا الإجراء');
        }

        return true;
    }
}
