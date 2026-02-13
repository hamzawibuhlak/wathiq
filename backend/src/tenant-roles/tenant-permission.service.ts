import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../common/prisma/prisma.service';
import { AccessLevel, AccessScope } from '@prisma/client';

/**
 * Permission entry from cache/DB
 */
export interface PermissionEntry {
    accessLevel: AccessLevel;
    scope: AccessScope;
}

/**
 * Cached permission map: { "cases.create": { accessLevel: "FULL", scope: "ALL" } }
 */
type PermissionMap = Record<string, PermissionEntry>;

const LEVEL_HIERARCHY: Record<AccessLevel, number> = {
    NONE: 0,
    VIEW: 1,
    EDIT: 2,
    FULL: 3,
};

const CACHE_TTL = 300_000; // 5 minutes
const CACHE_PREFIX = 'tenant_perm:';

@Injectable()
export class TenantPermissionService {
    private readonly logger = new Logger(TenantPermissionService.name);

    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    // ─── Core Permission Check ──────────────────────────

    /**
     * Check if a user has the required permission level for a resource/action.
     * Returns true if their level >= requiredLevel.
     */
    async checkPermission(
        userId: string,
        tenantId: string,
        resource: string,
        action: string,
        requiredLevel: AccessLevel = AccessLevel.VIEW,
        resourceOwnerId?: string,
        resourceAssignedId?: string,
    ): Promise<boolean> {
        // 1. Load user basic info
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
            select: { role: true, tenantRoleId: true },
        });

        if (!user) return false;

        // 2. OWNER and SUPER_ADMIN bypass all checks
        if (user.role === 'OWNER' || user.role === 'SUPER_ADMIN') {
            return true;
        }

        // 3. If user has no tenant role, fall back to legacy role behavior
        if (!user.tenantRoleId) {
            return this.legacyRoleCheck(user.role, resource, action, requiredLevel);
        }

        // 4. Load permission map (cached)
        const permMap = await this.getUserPermissionMap(userId);
        const key = `${resource}.${action}`;
        const perm = permMap[key];

        if (!perm || perm.accessLevel === 'NONE') {
            return false;
        }

        // 5. Check level hierarchy
        if (LEVEL_HIERARCHY[perm.accessLevel] < LEVEL_HIERARCHY[requiredLevel]) {
            return false;
        }

        // 6. Check scope if applicable
        if (perm.scope !== 'ALL' && resourceOwnerId) {
            return this.evaluateScope(perm.scope, userId, resourceOwnerId, resourceAssignedId);
        }

        return true;
    }

    // ─── Permission Map ─────────────────────────────────

    /**
     * Get a user's full permission map, from cache or DB.
     */
    async getUserPermissionMap(userId: string): Promise<PermissionMap> {
        const cacheKey = `${CACHE_PREFIX}${userId}`;

        // Try cache first
        const cached = await this.cacheManager.get<PermissionMap>(cacheKey);
        if (cached) {
            return cached;
        }

        // Load from DB
        const permMap = await this.loadPermissionMapFromDB(userId);

        // Cache it
        await this.cacheManager.set(cacheKey, permMap, CACHE_TTL);

        return permMap;
    }

    /**
     * Load permission map from DB via the user's tenantRole.
     */
    private async loadPermissionMapFromDB(userId: string): Promise<PermissionMap> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                tenantRoleId: true,
                tenantRole: {
                    select: {
                        permissions: {
                            select: {
                                resource: true,
                                action: true,
                                accessLevel: true,
                                scope: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user?.tenantRole?.permissions) {
            return {};
        }

        const permMap: PermissionMap = {};
        for (const p of user.tenantRole.permissions) {
            permMap[`${p.resource}.${p.action}`] = {
                accessLevel: p.accessLevel,
                scope: p.scope,
            };
        }

        return permMap;
    }

    // ─── Scope Evaluation ───────────────────────────────

    private evaluateScope(
        scope: AccessScope,
        userId: string,
        resourceOwnerId?: string,
        resourceAssignedId?: string,
    ): boolean {
        switch (scope) {
            case 'OWN':
                return resourceOwnerId === userId;
            case 'ASSIGNED':
                return resourceOwnerId === userId || resourceAssignedId === userId;
            case 'TEAM':
                // For now, TEAM = ALL (can be enhanced to team-based filtering later)
                return true;
            case 'ALL':
                return true;
            default:
                return false;
        }
    }

    // ─── Scope Filter for Prisma Queries ────────────────

    /**
     * Build a Prisma `where` filter based on the user's scope for a resource/action.
     * Returns an empty object if scope is ALL (no filtering needed).
     */
    async buildScopeFilter(
        userId: string,
        resource: string,
        action: string,
    ): Promise<Record<string, any>> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, tenantRoleId: true },
        });

        // OWNER/SUPER_ADMIN or no tenant role = no scope filtering
        if (!user || user.role === 'OWNER' || user.role === 'SUPER_ADMIN' || !user.tenantRoleId) {
            return {};
        }

        const permMap = await this.getUserPermissionMap(userId);
        const key = `${resource}.${action}`;
        const perm = permMap[key];

        if (!perm || perm.accessLevel === 'NONE') {
            return { id: 'BLOCKED_NO_ACCESS' }; // Will match nothing
        }

        switch (perm.scope) {
            case 'OWN':
                return this.buildOwnerFilter(resource, userId);
            case 'ASSIGNED':
                return this.buildAssignedFilter(resource, userId);
            case 'TEAM':
            case 'ALL':
                return {};
            default:
                return {};
        }
    }

    private buildOwnerFilter(resource: string, userId: string): Record<string, any> {
        const ownerFields: Record<string, string> = {
            cases: 'createdById',
            clients: 'id', // Clients don't have a direct owner; use visibility
            hearings: 'createdById',
            documents: 'uploadedById',
            invoices: 'createdById',
            tasks: 'createdById',
        };
        const field = ownerFields[resource] || 'createdById';
        return { [field]: userId };
    }

    private buildAssignedFilter(resource: string, userId: string): Record<string, any> {
        const filters: Record<string, any> = {
            cases: { OR: [{ createdById: userId }, { assignedToId: userId }] },
            hearings: { OR: [{ createdById: userId }, { assignedToId: userId }] },
            tasks: { OR: [{ createdById: userId }, { assignedToUserId: userId }] },
            documents: { uploadedById: userId },
            invoices: { createdById: userId },
            clients: { visibleToUsers: { some: { id: userId } } },
        };
        return filters[resource] || { createdById: userId };
    }

    // ─── Legacy Role Fallback ───────────────────────────

    /**
     * Backward-compatible check for users without a TenantRole.
     * Maps the old UserRole enum to basic permission levels.
     */
    private legacyRoleCheck(
        role: string,
        resource: string,
        action: string,
        requiredLevel: AccessLevel,
    ): boolean {
        // ADMIN has broad access
        if (role === 'ADMIN') {
            return true;
        }

        // LAWYER: read/edit on cases, hearings, documents, tasks
        if (role === 'LAWYER') {
            const lawyerModules = ['cases', 'hearings', 'documents', 'tasks', 'clients'];
            if (lawyerModules.includes(resource)) {
                return LEVEL_HIERARCHY[requiredLevel] <= LEVEL_HIERARCHY.EDIT;
            }
            if (resource === 'invoices' || resource === 'reports') {
                return requiredLevel === 'VIEW';
            }
            return false;
        }

        // SECRETARY: view most things, edit clients/hearings
        if (role === 'SECRETARY') {
            const editModules = ['clients', 'hearings'];
            if (editModules.includes(resource)) {
                return LEVEL_HIERARCHY[requiredLevel] <= LEVEL_HIERARCHY.EDIT;
            }
            return requiredLevel === 'VIEW';
        }

        // ACCOUNTANT: full on accounting/invoices, view on others
        if (role === 'ACCOUNTANT') {
            if (resource === 'accounting' || resource === 'invoices') {
                return true;
            }
            return requiredLevel === 'VIEW';
        }

        return false;
    }

    // ─── Cache Management ───────────────────────────────

    /**
     * Clear a single user's permission cache.
     */
    async clearUserCache(userId: string): Promise<void> {
        await this.cacheManager.del(`${CACHE_PREFIX}${userId}`);
        this.logger.log(`Cleared permission cache for user ${userId}`);
    }

    /**
     * Clear cache for all users assigned to a specific role.
     */
    async clearRoleCache(roleId: string): Promise<void> {
        const users = await this.prisma.user.findMany({
            where: { tenantRoleId: roleId },
            select: { id: true },
        });

        for (const user of users) {
            await this.cacheManager.del(`${CACHE_PREFIX}${user.id}`);
        }

        this.logger.log(`Cleared permission cache for ${users.length} users with role ${roleId}`);
    }

    // ─── Frontend API Helper ────────────────────────────

    /**
     * Get user's complete permission map for the frontend.
     * Returns a structured object that the frontend can use for UI gating.
     */
    async getPermissionsForFrontend(userId: string, tenantId: string) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
            select: { role: true, tenantRoleId: true, tenantRole: { select: { name: true, nameEn: true } } },
        });

        if (!user) return { role: null, tenantRole: null, permissions: {} };

        // OWNER gets everything
        if (user.role === 'OWNER' || user.role === 'SUPER_ADMIN') {
            return {
                role: user.role,
                tenantRole: null,
                isOwner: true,
                permissions: {}, // Frontend treats empty + isOwner as "full access"
            };
        }

        const permMap = user.tenantRoleId
            ? await this.getUserPermissionMap(userId)
            : {};

        return {
            role: user.role,
            tenantRole: user.tenantRole ? { name: user.tenantRole.name, nameEn: user.tenantRole.nameEn } : null,
            isOwner: false,
            permissions: permMap,
        };
    }
}
