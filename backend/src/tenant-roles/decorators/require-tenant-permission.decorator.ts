import { SetMetadata } from '@nestjs/common';

export interface TenantPermissionMeta {
    resource: string;
    action: string;
    level: 'VIEW' | 'EDIT' | 'FULL';
}

export const TENANT_PERMISSION_KEY = 'tenant_permission';

/**
 * Decorator to require a specific tenant-scoped permission.
 * Usage: @RequireTenantPermission('cases', 'create', 'EDIT')
 */
export const RequireTenantPermission = (
    resource: string,
    action: string,
    level: 'VIEW' | 'EDIT' | 'FULL' = 'VIEW',
) => SetMetadata(TENANT_PERMISSION_KEY, { resource, action, level } as TenantPermissionMeta);
