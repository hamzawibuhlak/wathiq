import { SetMetadata } from '@nestjs/common';

export const RequirePermission = (
    resource: string,
    action: string,
    level: 'VIEW' | 'EDIT' | 'FULL' = 'VIEW',
) => SetMetadata('permission', { resource, action, level });
