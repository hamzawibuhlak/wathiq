import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

const LEVEL_ORDER = ['NONE', 'VIEW', 'EDIT', 'FULL'];

@Injectable()
export class PermissionService {
    constructor(private prisma: PrismaService) { }

    // ── Check Single Permission ────────────────
    async checkPermission(
        userId: string,
        resource: string,
        action: string,
        requiredLevel: 'VIEW' | 'EDIT' | 'FULL' = 'VIEW',
    ): Promise<boolean> {
        const user = await this.prisma.superAdminUser.findUnique({
            where: { id: userId },
            include: {
                customRole: {
                    include: { permissions: true },
                },
            },
        });

        if (!user) return false;

        // If no customRole assigned, fall back to built-in role defaults
        if (!user.customRole) {
            // OWNER always passes
            if (user.role === 'OWNER') return true;

            // Built-in role defaults (when custom roles table doesn't exist or no role assigned)
            const roleDefaults: Record<string, string> = {
                MANAGER: 'FULL',    // Managers get full access by default
                SUPPORT: 'EDIT',    // Support can view and edit
                MODERATOR: 'EDIT',  // Moderators can view and edit
                SALES: 'VIEW',      // Sales can only view
            };

            const defaultLevel = roleDefaults[user.role];
            if (!defaultLevel) return false;

            const userLevelIndex = LEVEL_ORDER.indexOf(defaultLevel);
            const requiredLevelIndex = LEVEL_ORDER.indexOf(requiredLevel);
            return userLevelIndex >= requiredLevelIndex;
        }

        // System OWNER role always passes
        if (user.customRole.isSystem && user.customRole.name === 'مالك المنصة') {
            return true;
        }

        const permission = user.customRole.permissions.find(
            p => p.resource === resource && p.action === action,
        );

        if (!permission) return false;

        const userLevelIndex = LEVEL_ORDER.indexOf(permission.accessLevel);
        const requiredLevelIndex = LEVEL_ORDER.indexOf(requiredLevel);

        return userLevelIndex >= requiredLevelIndex;
    }

    // ── Get All User Permissions ─────────────────
    async getUserPermissions(userId: string): Promise<Record<string, Record<string, string>>> {
        const user = await this.prisma.superAdminUser.findUnique({
            where: { id: userId },
            include: {
                customRole: {
                    include: { permissions: true },
                },
            },
        });

        if (!user?.customRole) return {};

        const permMap: Record<string, Record<string, string>> = {};
        for (const perm of user.customRole.permissions) {
            if (!permMap[perm.resource]) permMap[perm.resource] = {};
            permMap[perm.resource][perm.action] = perm.accessLevel;
        }

        return permMap;
    }

    // ── Check Multiple Permissions ──────────────
    async checkMultiplePermissions(
        userId: string,
        checks: Array<{ resource: string; action: string; level?: string }>,
    ): Promise<Record<string, boolean>> {
        const results: Record<string, boolean> = {};

        for (const check of checks) {
            const key = `${check.resource}.${check.action}`;
            results[key] = await this.checkPermission(
                userId,
                check.resource,
                check.action,
                (check.level as any) || 'VIEW',
            );
        }

        return results;
    }
}
