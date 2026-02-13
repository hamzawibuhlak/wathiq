import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private permissionService: PermissionService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermission = this.reflector.get<{
            resource: string;
            action: string;
            level?: string;
        }>('permission', context.getHandler());

        // No permission required — allow
        if (!requiredPermission) return true;

        const request = context.switchToHttp().getRequest();
        const userId = request.superAdmin?.sub;

        if (!userId) throw new ForbiddenException('غير مصرح');

        const hasPermission = await this.permissionService.checkPermission(
            userId,
            requiredPermission.resource,
            requiredPermission.action,
            (requiredPermission.level as any) || 'VIEW',
        );

        if (!hasPermission) {
            throw new ForbiddenException('ليس لديك صلاحية لهذا الإجراء');
        }

        return true;
    }
}
