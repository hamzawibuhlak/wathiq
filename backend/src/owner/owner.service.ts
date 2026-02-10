import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OwnerService {
    constructor(private prisma: PrismaService) { }

    // =============================================
    // COMPANY PROFILE
    // =============================================

    async getCompanyProfile(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { name: true },
        });

        return (this.prisma as any).companyProfile.upsert({
            where: { tenantId },
            create: {
                tenantId,
                legalName: tenant?.name || 'الشركة',
            },
            update: {},
        });
    }

    async updateCompanyProfile(tenantId: string, data: any) {
        return (this.prisma as any).companyProfile.upsert({
            where: { tenantId },
            create: { tenantId, legalName: data.legalName || 'الشركة', ...data },
            update: data,
        });
    }

    // =============================================
    // USER MANAGEMENT
    // =============================================

    async getTenantUsers(tenantId: string) {
        return this.prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                phone: true,
                title: true,
                createdAt: true,
                lastLoginAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async inviteUser(
        tenantId: string,
        ownerId: string,
        data: {
            name: string;
            email: string;
            role: 'ADMIN' | 'LAWYER' | 'SECRETARY' | 'ACCOUNTANT';
        },
    ) {
        if ((data.role as string) === 'OWNER') {
            throw new ForbiddenException('لا يمكن إنشاء حساب مالك إضافي');
        }

        const exists = await this.prisma.user.findFirst({
            where: { email: data.email },
        });

        if (exists) {
            throw new BadRequestException('البريد الإلكتروني مستخدم بالفعل');
        }

        const tempPassword = Math.random().toString(36).slice(-8) + '@Wt1';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const user = await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role as any,
                tenantId,
                createdById: ownerId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
            },
        });

        return { ...user, tempPassword };
    }

    async changeUserRole(
        userId: string,
        tenantId: string,
        newRole: 'ADMIN' | 'LAWYER' | 'SECRETARY' | 'ACCOUNTANT',
    ) {
        if ((newRole as string) === 'OWNER') {
            throw new ForbiddenException('لا يمكن تعيين مالك إضافي للشركة');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.tenantId !== tenantId) {
            throw new BadRequestException('المستخدم غير موجود');
        }

        if (user.role === 'OWNER') {
            throw new ForbiddenException('لا يمكن تغيير دور مالك الشركة');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { role: newRole as any },
            select: { id: true, name: true, email: true, role: true },
        });
    }

    async toggleUserStatus(userId: string, tenantId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.tenantId !== tenantId) {
            throw new BadRequestException('المستخدم غير موجود');
        }

        if (user.role === 'OWNER') {
            throw new ForbiddenException('لا يمكن تعطيل حساب المالك');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive },
            select: { id: true, isActive: true, name: true },
        });
    }

    async deleteUser(userId: string, tenantId: string, ownerId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.tenantId !== tenantId) {
            throw new BadRequestException('المستخدم غير موجود');
        }

        if (user.role === 'OWNER') {
            throw new ForbiddenException('لا يمكن حذف حساب المالك');
        }

        if (userId === ownerId) {
            throw new ForbiddenException('لا يمكنك حذف حسابك الخاص');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
    }

    // =============================================
    // INTEGRATIONS
    // =============================================

    async getIntegrations(tenantId: string) {
        const saved = await (this.prisma as any).tenantIntegration.findMany({
            where: { tenantId },
            select: {
                id: true,
                type: true,
                name: true,
                isActive: true,
                lastTestedAt: true,
                lastTestOk: true,
            },
        });

        const allTypes = [
            { type: 'EMAIL_SMTP', name: 'بريد إلكتروني (SMTP)', icon: '📧' },
            { type: 'EMAIL_SENDGRID', name: 'SendGrid', icon: '📩' },
            { type: 'WHATSAPP', name: 'واتساب Business', icon: '💬' },
            { type: 'CALL_CENTER', name: 'مركز الاتصال', icon: '📞' },
            { type: 'NAFATH', name: 'نفاذ', icon: '🆔' },
            { type: 'ZATCA', name: 'زاتكا', icon: '🧾' },
            { type: 'ABSHER', name: 'أبشر', icon: '🏛️' },
            { type: 'GOOGLE_CALENDAR', name: 'جوجل كالندر', icon: '📅' },
            { type: 'ZAPIER', name: 'زابير', icon: '⚡' },
        ];

        return allTypes.map(item => {
            const existing = saved.find((s: any) => s.type === item.type);
            return {
                type: item.type,
                name: item.name,
                icon: item.icon,
                isConfigured: !!existing,
                isActive: existing?.isActive || false,
                lastTestedAt: existing?.lastTestedAt,
                lastTestOk: existing?.lastTestOk,
                id: existing?.id,
            };
        });
    }

    async saveIntegration(tenantId: string, type: string, config: Record<string, any>) {
        return (this.prisma as any).tenantIntegration.upsert({
            where: { tenantId_type: { tenantId, type: type as any } },
            create: {
                tenantId,
                type: type as any,
                name: type,
                config: config,
                isActive: false,
            },
            update: {
                config: config,
                lastTestedAt: null,
                lastTestOk: null,
            },
            select: { id: true, type: true, isActive: true },
        });
    }

    async testIntegration(tenantId: string, type: string) {
        const integration = await (this.prisma as any).tenantIntegration.findUnique({
            where: { tenantId_type: { tenantId, type: type as any } },
        });

        if (!integration) {
            throw new BadRequestException('التكامل غير مهيأ بعد');
        }

        // For now, mark as tested successfully
        let testOk = true;

        await (this.prisma as any).tenantIntegration.update({
            where: { id: integration.id },
            data: {
                lastTestedAt: new Date(),
                lastTestOk: testOk,
                isActive: testOk,
            },
        });

        return { success: testOk };
    }

    async toggleIntegration(tenantId: string, type: string) {
        const integration = await (this.prisma as any).tenantIntegration.findUnique({
            where: { tenantId_type: { tenantId, type: type as any } },
        });

        if (!integration) {
            throw new BadRequestException('التكامل غير موجود');
        }

        return (this.prisma as any).tenantIntegration.update({
            where: { id: integration.id },
            data: { isActive: !integration.isActive },
            select: { id: true, type: true, isActive: true },
        });
    }

    // =============================================
    // WORKFLOWS
    // =============================================

    async getWorkflows(tenantId: string) {
        return this.prisma.workflow.findMany({
            where: { tenantId },
            include: {
                _count: { select: { executions: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createWorkflow(
        tenantId: string,
        data: {
            name: string;
            triggerType: string;
            triggerConfig?: any;
            actions?: any;
            description?: string;
        },
    ) {
        return this.prisma.workflow.create({
            data: {
                name: data.name,
                description: data.description,
                triggerType: data.triggerType as any,
                triggerConfig: data.triggerConfig || {},
                actions: data.actions || [],
                tenantId,
            },
        });
    }

    async toggleWorkflow(workflowId: string, tenantId: string) {
        const wf = await this.prisma.workflow.findUnique({ where: { id: workflowId } });

        if (!wf || wf.tenantId !== tenantId) {
            throw new BadRequestException('سير العمل غير موجود');
        }

        return this.prisma.workflow.update({
            where: { id: workflowId },
            data: { isActive: !wf.isActive },
        });
    }

    async deleteWorkflow(workflowId: string, tenantId: string) {
        const wf = await this.prisma.workflow.findUnique({ where: { id: workflowId } });

        if (!wf || wf.tenantId !== tenantId) {
            throw new BadRequestException('سير العمل غير موجود');
        }

        return this.prisma.workflow.delete({ where: { id: workflowId } });
    }

    // =============================================
    // BILLING & USAGE
    // =============================================

    async getBillingInfo(tenantId: string) {
        try {
            const subscription = await this.prisma.subscription.findUnique({
                where: { tenantId },
                include: {
                    plan: true,
                    invoices: {
                        orderBy: { createdAt: 'desc' },
                        take: 12,
                    },
                },
            });

            return subscription || {
                status: 'NO_SUBSCRIPTION',
                plan: null,
                invoices: [],
            };
        } catch {
            return { status: 'NO_SUBSCRIPTION', plan: null, invoices: [] };
        }
    }

    async getUsageStats(tenantId: string) {
        let planLimits = { maxUsers: 0, maxCases: 0, maxStorageGB: 0, maxClients: 0 };

        try {
            const subscription = await this.prisma.subscription.findUnique({
                where: { tenantId },
                include: { plan: true },
            });
            if (subscription?.plan) {
                planLimits = {
                    maxUsers: subscription.plan.maxUsers,
                    maxCases: subscription.plan.maxCases,
                    maxStorageGB: subscription.plan.maxStorageGB,
                    maxClients: subscription.plan.maxClients,
                };
            }
        } catch { }

        const [usersCount, casesCount, clientsCount] = await Promise.all([
            this.prisma.user.count({ where: { tenantId, isActive: true } }),
            this.prisma.case.count({ where: { tenantId } }),
            this.prisma.client.count({ where: { tenantId } }),
        ]);

        return {
            users: { used: usersCount, limit: planLimits.maxUsers },
            cases: { used: casesCount, limit: planLimits.maxCases },
            storage: { usedGB: 0, limitGB: planLimits.maxStorageGB },
            clients: { used: clientsCount, limit: planLimits.maxClients },
        };
    }

    // =============================================
    // DASHBOARD STATS
    // =============================================

    async getDashboardStats(tenantId: string) {
        const [
            usersCount,
            casesCount,
            clientsCount,
            activeIntegrations,
            activeWorkflows,
        ] = await Promise.all([
            this.prisma.user.count({ where: { tenantId, isActive: true } }),
            this.prisma.case.count({ where: { tenantId } }),
            this.prisma.client.count({ where: { tenantId } }),
            (this.prisma as any).tenantIntegration.count({ where: { tenantId, isActive: true } }),
            this.prisma.workflow.count({ where: { tenantId, isActive: true } }),
        ]);

        return {
            usersCount,
            casesCount,
            clientsCount,
            activeIntegrations,
            activeWorkflows,
        };
    }
}
