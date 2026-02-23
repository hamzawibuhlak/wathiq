import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MODULES, getDefaultModulesByPlan, getRegistrationDefaults } from '../common/constants/modules.constants';

@Injectable()
export class ModuleSettingsService {
    constructor(private prisma: PrismaService) { }

    // ══════════════════════════════════════════════════════════
    // GET TENANT MODULES (Super Admin view)
    // ══════════════════════════════════════════════════════════

    async getTenantModules(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { moduleSettings: true } as any,
        });

        if (!tenant) throw new NotFoundException('المكتب غير موجود');

        // If Super Admin has not configured modules yet, return restricted defaults
        // (only core modules: Dashboard + Settings)
        if (!(tenant as any).moduleSettings) {
            return getRegistrationDefaults();
        }

        const defaults = getDefaultModulesByPlan(tenant.planType);

        // Merge saved over defaults (deep merge for features)
        const saved = (tenant as any).moduleSettings.modules as Record<string, any>;
        const merged: Record<string, any> = {};

        Object.keys(defaults).forEach(key => {
            const defaultMod = defaults[key];
            const savedMod = saved[key];

            if (!savedMod) {
                merged[key] = defaultMod;
                return;
            }

            // Deep merge: module-level enabled + feature-level overrides
            merged[key] = {
                enabled: savedMod.enabled !== undefined ? savedMod.enabled : defaultMod.enabled,
                features: {
                    ...defaultMod.features,
                    ...(savedMod.features || {}),
                },
            };
        });

        return merged;
    }

    // ══════════════════════════════════════════════════════════
    // GET MY MODULES (Tenant-side — returns full structure)
    // ══════════════════════════════════════════════════════════

    async getMyModules(tenantId: string) {
        return this.getTenantModules(tenantId);
    }

    // ══════════════════════════════════════════════════════════
    // UPDATE MODULE (enable/disable a whole module)
    // ══════════════════════════════════════════════════════════

    async updateModule(
        tenantId: string,
        moduleKey: string,
        enabled: boolean,
        superAdminId: string,
        reason?: string,
    ) {
        const moduleDef = Object.values(MODULES).find(m => m.key === moduleKey);
        if (!moduleDef) {
            throw new NotFoundException(`Module ${moduleKey} غير موجود`);
        }

        if (moduleDef.isCore && !enabled) {
            throw new BadRequestException('لا يمكن تعطيل الأقسام الأساسية');
        }

        const current = await this.getTenantModules(tenantId);
        const previousValue = current[moduleKey]?.enabled ?? false;

        // Build new modules JSON
        const newModules = { ...current };
        newModules[moduleKey] = { ...newModules[moduleKey], enabled };

        // When disabling a module, disable all its features too
        if (!enabled && newModules[moduleKey].features) {
            const disabledFeatures: Record<string, boolean> = {};
            Object.keys(newModules[moduleKey].features).forEach(fk => {
                disabledFeatures[fk] = false;
            });
            newModules[moduleKey].features = disabledFeatures;
        }

        // When enabling a module, enable all non-core features too
        if (enabled && newModules[moduleKey].features) {
            const enabledFeatures: Record<string, boolean> = {};
            Object.keys(newModules[moduleKey].features).forEach(fk => {
                enabledFeatures[fk] = true;
            });
            newModules[moduleKey].features = enabledFeatures;
        }

        await (this.prisma as any).tenantModuleSettings.upsert({
            where: { tenantId },
            create: {
                tenant: { connect: { id: tenantId } },
                updater: { connect: { id: superAdminId } },
                modules: newModules,
            },
            update: {
                modules: newModules,
                updatedBy: superAdminId,
            },
        });

        // Log the change
        await (this.prisma as any).moduleChangeLog.create({
            data: {
                tenant: { connect: { id: tenantId } },
                changer: { connect: { id: superAdminId } },
                moduleKey,
                action: enabled ? 'ENABLE' : 'DISABLE',
                previousValue,
                newValue: enabled,
                reason,
            },
        });

        return { success: true, moduleKey, enabled };
    }

    // ══════════════════════════════════════════════════════════
    // UPDATE FEATURE (enable/disable a single feature)
    // ══════════════════════════════════════════════════════════

    async updateFeature(
        tenantId: string,
        moduleKey: string,
        featureKey: string,
        enabled: boolean,
        superAdminId: string,
        reason?: string,
    ) {
        // Validate module exists
        const moduleDef = Object.values(MODULES).find(m => m.key === moduleKey);
        if (!moduleDef) {
            throw new NotFoundException(`Module ${moduleKey} غير موجود`);
        }

        // Validate feature exists in module
        const featureDef = moduleDef.features.find(f => f.key === featureKey);
        if (!featureDef) {
            throw new NotFoundException(`Feature ${featureKey} غير موجودة في ${moduleKey}`);
        }

        // Core features cannot be disabled
        if (featureDef.isCore && !enabled) {
            throw new BadRequestException('لا يمكن تعطيل المميزات الأساسية');
        }

        const current = await this.getTenantModules(tenantId);

        // Module must be enabled to toggle features
        if (!current[moduleKey]?.enabled) {
            throw new BadRequestException('يجب تفعيل القسم أولاً قبل تعديل المميزات');
        }

        const previousValue = current[moduleKey]?.features?.[featureKey] ?? true;

        // Build new modules JSON
        const newModules = { ...current };
        newModules[moduleKey] = {
            ...newModules[moduleKey],
            features: {
                ...(newModules[moduleKey].features || {}),
                [featureKey]: enabled,
            },
        };

        await (this.prisma as any).tenantModuleSettings.upsert({
            where: { tenantId },
            create: {
                tenant: { connect: { id: tenantId } },
                updater: { connect: { id: superAdminId } },
                modules: newModules,
            },
            update: {
                modules: newModules,
                updatedBy: superAdminId,
            },
        });

        // Log the change
        await (this.prisma as any).moduleChangeLog.create({
            data: {
                tenant: { connect: { id: tenantId } },
                changer: { connect: { id: superAdminId } },
                moduleKey: `${moduleKey}.${featureKey}`,
                action: enabled ? 'ENABLE_FEATURE' : 'DISABLE_FEATURE',
                previousValue,
                newValue: enabled,
                reason,
            },
        });

        return { success: true, moduleKey, featureKey, enabled };
    }

    // ══════════════════════════════════════════════════════════
    // BULK UPDATE (batch enable/disable)
    // ══════════════════════════════════════════════════════════

    async bulkUpdate(
        tenantId: string,
        updates: Array<{ moduleKey: string; enabled: boolean }>,
        superAdminId: string,
        reason?: string,
    ) {
        const current = await this.getTenantModules(tenantId);
        const newModules = { ...current };

        for (const update of updates) {
            const moduleDef = Object.values(MODULES).find(m => m.key === update.moduleKey);
            if (!moduleDef) continue;
            if (moduleDef.isCore && !update.enabled) continue;

            const previousValue = current[update.moduleKey]?.enabled ?? false;
            newModules[update.moduleKey] = { ...newModules[update.moduleKey], enabled: update.enabled };

            await (this.prisma as any).moduleChangeLog.create({
                data: {
                    tenant: { connect: { id: tenantId } },
                    changer: { connect: { id: superAdminId } },
                    moduleKey: update.moduleKey,
                    action: update.enabled ? 'ENABLE' : 'DISABLE',
                    previousValue,
                    newValue: update.enabled,
                    reason,
                },
            });
        }

        await (this.prisma as any).tenantModuleSettings.upsert({
            where: { tenantId },
            create: {
                tenant: { connect: { id: tenantId } },
                updater: { connect: { id: superAdminId } },
                modules: newModules,
            },
            update: {
                modules: newModules,
                updatedBy: superAdminId,
            },
        });

        return { success: true, updatedCount: updates.length };
    }

    // ══════════════════════════════════════════════════════════
    // APPLY PLAN (reset to plan defaults)
    // ══════════════════════════════════════════════════════════

    async applyPlan(
        tenantId: string,
        plan: string,
        superAdminId: string,
    ) {
        const defaults = getDefaultModulesByPlan(plan);

        await (this.prisma as any).tenantModuleSettings.upsert({
            where: { tenantId },
            create: {
                tenant: { connect: { id: tenantId } },
                updater: { connect: { id: superAdminId } },
                modules: defaults,
            },
            update: {
                modules: defaults,
                updatedBy: superAdminId,
            },
        });

        // Log plan application
        await (this.prisma as any).moduleChangeLog.create({
            data: {
                tenant: { connect: { id: tenantId } },
                changer: { connect: { id: superAdminId } },
                moduleKey: 'ALL',
                action: `APPLY_PLAN_${plan}`,
                previousValue: false,
                newValue: true,
                reason: `تطبيق إعدادات باقة ${plan}`,
            },
        });

        return { success: true, plan, modules: defaults };
    }

    // ══════════════════════════════════════════════════════════
    // CHANGE LOG
    // ══════════════════════════════════════════════════════════

    async getChangeLog(tenantId: string, limit = 50) {
        return (this.prisma as any).moduleChangeLog.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                changer: { select: { id: true, name: true, email: true } },
            },
        });
    }
}
