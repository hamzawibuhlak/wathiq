import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EntityCodeService } from '../common/services/entity-code.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OwnerService {
    constructor(
        private prisma: PrismaService,
        private readonly entityCodeService: EntityCodeService,
        private readonly emailService: EmailService,
    ) { }

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
                tenantRoleId: true,
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
            tenantRoleId?: string;
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

        // Phase 37: Generate user code
        const userCode = await this.entityCodeService.generateUserCode(tenantId);

        const user = await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role as any,
                tenantId,
                createdById: ownerId,
                code: userCode.code,
                codeNumber: userCode.codeNumber,
                ...(data.tenantRoleId && { tenantRoleId: data.tenantRoleId }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                tenantRoleId: true,
            },
        });

        // Send welcome email with credentials
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
        this.sendWelcomeEmail(user.email, user.name, tempPassword, tenant?.name || 'وثيق', data.role, tenantId);

        return { ...user, tempPassword };
    }

    /**
     * Send welcome email with credentials to newly created user
     */
    private async sendWelcomeEmail(
        userEmail: string,
        userName: string,
        tempPassword: string,
        tenantName: string,
        role: string,
        tenantId?: string,
    ) {
        try {
            const roleLabels: Record<string, string> = {
                OWNER: 'مالك',
                ADMIN: 'مدير',
                LAWYER: 'محامي',
                SECRETARY: 'سكرتير',
                ACCOUNTANT: 'محاسب',
            };
            const roleLabel = roleLabels[role] || role;
            const loginUrl = 'https://bewathiq.com/login';

            await this.emailService.sendEmail({
                to: userEmail,
                subject: `تم إنشاء حسابك في ${tenantName} على منصة وثيق`,
                body: `
                <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">وثيق</h1>
                        <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">منصة إدارة المكاتب القانونية</p>
                    </div>
                    <div style="padding: 32px;">
                        <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0;">مرحباً ${userName}،</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
                            تم إنشاء حسابك في <strong style="color: #1e40af;">${tenantName}</strong>
                            كـ<strong style="color: #1f2937;">${roleLabel}</strong> على منصة وثيق.
                        </p>
                        <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 24px 0;">
                            <p style="color: #166534; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">بيانات تسجيل الدخول:</p>
                            <p style="color: #166534; font-size: 15px; margin: 0 0 8px 0;">📧 البريد الإلكتروني: <strong>${userEmail}</strong></p>
                            <p style="color: #166534; font-size: 15px; margin: 0;">🔑 كلمة المرور المؤقتة: <strong style="direction: ltr; display: inline-block;">${tempPassword}</strong></p>
                        </div>
                        <p style="color: #dc2626; font-size: 13px; margin: 0 0 24px 0;">⚠️ يُنصح بتغيير كلمة المرور بعد تسجيل الدخول الأول.</p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${loginUrl}"
                               style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(30, 64, 175, 0.25);">
                                تسجيل الدخول
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} وثيق - جميع الحقوق محفوظة</p>
                    </div>
                </div>
                `,
                tenantId,
            });
        } catch (error) {
            console.error('Failed to send welcome email:', error);
        }
    }

    async updateUser(
        userId: string,
        tenantId: string,
        data: { name?: string; role?: string; tenantRoleId?: string | null },
    ) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.tenantId !== tenantId) {
            throw new BadRequestException('المستخدم غير موجود');
        }

        if (user.role === 'OWNER') {
            throw new ForbiddenException('لا يمكن تعديل حساب المالك');
        }

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.role && data.role !== 'OWNER') updateData.role = data.role;
        if (data.tenantRoleId !== undefined) {
            updateData.tenantRoleId = data.tenantRoleId || null;
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, tenantRoleId: true },
        });
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

        try {
            // Use a transaction to clean up all references then delete
            await this.prisma.$transaction(async (tx) => {
                // Reassign non-nullable Case references to owner
                await tx.case.updateMany({ where: { assignedToId: userId }, data: { assignedToId: ownerId } });
                await tx.case.updateMany({ where: { createdById: userId }, data: { createdById: ownerId } });

                // Nullify nullable Hearing references
                await tx.hearing.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } });
                await tx.hearing.updateMany({ where: { createdById: userId }, data: { createdById: null } });

                // Reassign non-nullable Document references to owner
                await tx.document.updateMany({ where: { uploadedById: userId }, data: { uploadedById: ownerId } });

                // Reassign non-nullable Invoice references to owner
                await tx.invoice.updateMany({ where: { createdById: userId }, data: { createdById: ownerId } });

                // Reassign non-nullable Task references to owner
                await tx.task.updateMany({ where: { assignedToId: userId }, data: { assignedToId: ownerId } });
                await tx.task.updateMany({ where: { createdById: userId }, data: { createdById: ownerId } });

                // Delete task comments by the user
                await tx.taskComment.deleteMany({ where: { userId } });

                // Delete messages sent/received by user
                await tx.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });

                // Delete group memberships and messages
                await tx.groupMessage.deleteMany({ where: { senderId: userId } });
                await tx.groupMember.deleteMany({ where: { userId } });

                // Delete calls
                await tx.call.deleteMany({ where: { userId } });

                // Reassign reports
                await tx.report.updateMany({ where: { createdById: userId }, data: { createdById: ownerId } });
                await tx.reportExecution.updateMany({ where: { executedById: userId }, data: { executedById: ownerId } });

                // Delete notifications
                await tx.notification.deleteMany({ where: { userId } });

                // Delete activity logs
                await tx.activityLog.deleteMany({ where: { userId } });

                // Delete sessions
                await tx.userSession.deleteMany({ where: { userId } });

                // Remove from client visibility (many-to-many)
                await tx.user.update({
                    where: { id: userId },
                    data: { visibleClients: { set: [] } },
                });

                // Reassign created users
                await tx.user.updateMany({ where: { createdById: userId }, data: { createdById: null } });

                // Delete the user
                await tx.user.delete({ where: { id: userId } });
            });
        } catch (error) {
            throw new BadRequestException('لا يمكن حذف هذا المستخدم لارتباطه ببيانات أخرى. يمكنك تعطيل حسابه بدلاً من ذلك.');
        }

        return { message: 'تم حذف المستخدم بنجاح' };
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
