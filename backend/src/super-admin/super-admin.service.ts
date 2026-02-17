import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SuperAdminService {
    constructor(private prisma: PrismaService) { }

    // ═══════════════════════════════════════
    // OVERVIEW & STATS
    // ═══════════════════════════════════════

    async getOverviewStats() {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [total, active, frozen, newThisMonth, newLastMonth, basic, pro, enterprise, openChats] =
            await Promise.all([
                this.prisma.tenant.count({ where: { deletedAt: null } }),
                this.prisma.tenant.count({ where: { deletedAt: null, isFrozen: false } }),
                this.prisma.tenant.count({ where: { isFrozen: true } }),
                this.prisma.tenant.count({ where: { createdAt: { gte: thisMonth } } }),
                this.prisma.tenant.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
                this.prisma.tenant.count({ where: { planType: 'BASIC', deletedAt: null } }),
                this.prisma.tenant.count({ where: { planType: 'PROFESSIONAL', deletedAt: null } }),
                this.prisma.tenant.count({ where: { planType: 'ENTERPRISE', deletedAt: null } }),
                this.prisma.superAdminChatRoom.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            ]);

        const growth = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : 100;
        const estimatedRevenue = basic * 500 + pro * 1500 + enterprise * 3500;

        return {
            tenants: { total, active, frozen, newThisMonth, growth },
            plans: { basic, professional: pro, enterprise },
            revenue: { estimated: estimatedRevenue },
            support: { openChats },
        };
    }

    async getRecentRegistrations(limit = 10) {
        return this.prisma.tenant.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true, name: true, slug: true, planType: true,
                createdAt: true, city: true, isFrozen: true,
                users: {
                    where: { role: 'OWNER' },
                    select: { name: true, email: true },
                    take: 1,
                },
            },
        });
    }

    // ═══════════════════════════════════════
    // TENANT MANAGEMENT
    // ═══════════════════════════════════════

    async getAllTenants(filters?: {
        search?: string; planType?: string; isFrozen?: string;
        page?: number; limit?: number;
    }) {
        const { page = 1, limit = 20 } = filters || {};
        const where: any = { deletedAt: null };

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { slug: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters?.planType) where.planType = filters.planType;
        if (filters?.isFrozen === 'true') where.isFrozen = true;
        if (filters?.isFrozen === 'false') where.isFrozen = false;

        const [tenants, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                select: {
                    id: true, name: true, slug: true, city: true, email: true,
                    planType: true, isFrozen: true, frozenReason: true,
                    createdAt: true, planEndDate: true, isActive: true,
                    _count: { select: { users: true, cases: true } },
                    users: {
                        where: { role: 'OWNER' },
                        select: { name: true, email: true, phone: true },
                        take: 1,
                    },
                    superAdminChatRoom: {
                        select: { unreadCount: true, status: true, lastMessageAt: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.tenant.count({ where }),
        ]);

        return { data: tenants, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async getTenantDetails(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                users: {
                    select: {
                        id: true, name: true, email: true, phone: true,
                        role: true, isActive: true, createdAt: true, lastLoginAt: true,
                    },
                },
                _count: { select: { cases: true, clients: true, documents: true, users: true } },
                tenantNotes: { orderBy: { createdAt: 'desc' }, take: 20 },
                superAdminChatRoom: {
                    include: {
                        messages: { orderBy: { createdAt: 'desc' }, take: 20 },
                    },
                },
            },
        });
        if (!tenant) throw new NotFoundException('المكتب غير موجود');
        return tenant;
    }

    async freezeTenant(tenantId: string, reason: string, adminId: string) {
        const tenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { isFrozen: true, frozenReason: reason, frozenAt: new Date() },
        });
        await this.logAction(adminId, 'FREEZE_TENANT', 'TENANT', tenantId, { reason });
        return tenant;
    }

    async unfreezeTenant(tenantId: string, adminId: string) {
        const tenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { isFrozen: false, frozenReason: null, frozenAt: null },
        });
        await this.logAction(adminId, 'UNFREEZE_TENANT', 'TENANT', tenantId, {});
        return tenant;
    }

    async changePlan(tenantId: string, planType: string, adminId: string) {
        const tenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { planType: planType as any },
        });
        await this.logAction(adminId, 'CHANGE_PLAN', 'TENANT', tenantId, { planType });
        return tenant;
    }

    // حذف ناعم — قابل للاسترجاع
    async softDeleteTenant(tenantId: string, adminId: string) {
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { deletedAt: new Date(), isFrozen: true, frozenReason: 'تم حذف المكتب' },
        });
        await this.logAction(adminId, 'SOFT_DELETE_TENANT', 'TENANT', tenantId, {});
        return { success: true };
    }

    // حذف نهائي — OWNER فقط
    async hardDeleteTenant(tenantId: string, adminId: string) {
        // Delete in order to respect foreign key constraints
        await this.prisma.$transaction(async (tx) => {
            // Delete all related data
            await tx.tenantNote.deleteMany({ where: { tenantId } });
            await tx.superAdminChatMessage.deleteMany({
                where: { room: { tenantId } },
            });
            await tx.superAdminChatRoom.deleteMany({ where: { tenantId } });
            await tx.notification.deleteMany({ where: { tenantId } });
            await tx.activityLog.deleteMany({ where: { tenantId } });
            await tx.document.deleteMany({ where: { tenantId } });
            await tx.invoice.deleteMany({ where: { tenantId } });
            await tx.hearing.deleteMany({ where: { tenantId } });
            await tx.task.deleteMany({ where: { tenantId } });
            await tx.case.deleteMany({ where: { tenantId } });
            await tx.client.deleteMany({ where: { tenantId } });
            await tx.user.deleteMany({ where: { tenantId } });
            await tx.tenant.delete({ where: { id: tenantId } });
        });
        await this.logAction(adminId, 'HARD_DELETE_TENANT', 'TENANT', tenantId, { warning: 'PERMANENT' });
        return { success: true };
    }

    // ═══════════════════════════════════════
    // NOTES
    // ═══════════════════════════════════════

    async addNote(tenantId: string, adminId: string, content: string, type: string = 'GENERAL') {
        return this.prisma.tenantNote.create({
            data: { tenantId, content, type: type as any, addedBy: adminId },
        });
    }

    // ═══════════════════════════════════════
    // AUDIT LOG
    // ═══════════════════════════════════════

    async getAuditLogs(filters?: { page?: number; action?: string }) {
        const { page = 1 } = filters || {};
        const where: any = {};
        if (filters?.action) where.action = filters.action;

        const [data, total] = await Promise.all([
            this.prisma.superAdminAuditLog.findMany({
                where,
                include: { user: { select: { name: true, email: true, role: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * 30,
                take: 30,
            }),
            this.prisma.superAdminAuditLog.count({ where }),
        ]);

        return { data, meta: { page, total, totalPages: Math.ceil(total / 30) } };
    }

    private async logAction(adminId: string, action: string, targetType: string, targetId: string, details: any) {
        try {
            await this.prisma.superAdminAuditLog.create({
                data: { action, targetType, targetId, details, performedBy: adminId },
            });
        } catch (e) {
            // Don't fail the main operation if logging fails
            console.error('Audit log error:', e);
        }
    }

    // ═══════════════════════════════════════
    // SYSTEM CONFIG — Integrations & API Keys
    // ═══════════════════════════════════════

    async getConfigs(category?: string) {
        const where: any = {};
        if (category) where.category = category;

        const configs = await this.prisma.systemConfig.findMany({
            where,
            orderBy: { category: 'asc' },
        });

        // Mask sensitive values
        return configs.map(c => ({
            ...c,
            value: c.encrypted ? this.maskValue(c.value) : c.value,
        }));
    }

    async setConfig(data: { key: string; value: string; category?: string; label?: string; encrypted?: boolean }) {
        return this.prisma.systemConfig.upsert({
            where: { key: data.key },
            create: {
                key: data.key,
                value: data.value,
                category: data.category || 'general',
                label: data.label,
                encrypted: data.encrypted ?? false,
            },
            update: {
                value: data.value,
                ...(data.category && { category: data.category }),
                ...(data.label && { label: data.label }),
            },
        });
    }

    async deleteConfig(key: string) {
        await this.prisma.systemConfig.deleteMany({ where: { key } });
        return { success: true };
    }

    async testAIConnection() {
        const configs = await this.prisma.systemConfig.findMany({
            where: { category: 'ai' },
        });

        const configMap: Record<string, string> = {};
        configs.forEach(c => { configMap[c.key] = c.value; });

        const provider = configMap['AI_PROVIDER'] || 'auto';
        const openaiKey = configMap['OPENAI_API_KEY'];
        const anthropicKey = configMap['ANTHROPIC_API_KEY'];
        const openrouterKey = configMap['OPENROUTER_API_KEY'];

        // ─── OpenRouter ───
        if (provider === 'openrouter' || (provider === 'auto' && openrouterKey && !openaiKey && !anthropicKey)) {
            if (!openrouterKey) return { success: false, error: 'مفتاح OpenRouter غير مُعيَّن', provider: 'openrouter' };
            try {
                const OpenAI = (await import('openai')).default;
                const client = new OpenAI({
                    apiKey: openrouterKey,
                    baseURL: 'https://openrouter.ai/api/v1',
                });
                const model = configMap['OPENROUTER_MODEL'] || 'openai/gpt-4o-mini';
                const response = await client.chat.completions.create({
                    model,
                    max_tokens: 20,
                    messages: [{ role: 'user', content: 'قل: مرحبا' }],
                });
                return {
                    success: true,
                    provider: 'openrouter',
                    model,
                    response: response.choices?.[0]?.message?.content,
                };
            } catch (e: any) {
                return { success: false, provider: 'openrouter', error: e.message };
            }
        }

        // ─── OpenAI Direct ───
        if (provider === 'openai' || (provider === 'auto' && openaiKey && !anthropicKey)) {
            if (!openaiKey) return { success: false, error: 'مفتاح OpenAI غير مُعيَّن', provider: 'openai' };
            try {
                const OpenAI = (await import('openai')).default;
                const client = new OpenAI({ apiKey: openaiKey });
                const response = await client.chat.completions.create({
                    model: configMap['OPENAI_MODEL'] || 'gpt-4o',
                    max_tokens: 20,
                    messages: [{ role: 'user', content: 'قل: مرحبا' }],
                });
                return {
                    success: true,
                    provider: 'openai',
                    model: configMap['OPENAI_MODEL'] || 'gpt-4o',
                    response: response.choices?.[0]?.message?.content,
                };
            } catch (e: any) {
                return { success: false, provider: 'openai', error: e.message };
            }
        }

        // ─── Anthropic Direct ───
        if (anthropicKey) {
            try {
                const Anthropic = (await import('@anthropic-ai/sdk')).default;
                const client = new Anthropic({ apiKey: anthropicKey });
                const response = await client.messages.create({
                    model: configMap['ANTHROPIC_MODEL'] || 'claude-3-5-sonnet-20241022',
                    max_tokens: 20,
                    messages: [{ role: 'user', content: 'قل: مرحبا' }],
                });
                return {
                    success: true,
                    provider: 'anthropic',
                    model: configMap['ANTHROPIC_MODEL'] || 'claude-3-5-sonnet-20241022',
                    response: response.content[0]?.type === 'text' ? response.content[0].text : '',
                };
            } catch (e: any) {
                return { success: false, provider: 'anthropic', error: e.message };
            }
        }

        return { success: false, error: 'لا يوجد مفتاح API مُعيَّن' };
    }

    // ═══════════════════════════════════════
    // SMTP TEST
    // ═══════════════════════════════════════

    async testSmtpConnection(testEmail: string) {
        const configs = await this.prisma.systemConfig.findMany({
            where: { category: 'smtp' },
        });

        const cfg: Record<string, string> = {};
        configs.forEach(c => { cfg[c.key] = c.value; });

        if (!cfg['SMTP_HOST'] || !cfg['SMTP_USER'] || !cfg['SMTP_PASS']) {
            return { success: false, error: 'إعدادات SMTP غير مكتملة. يرجى إدخال الخادم واسم المستخدم وكلمة المرور.' };
        }

        try {
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.createTransport({
                host: cfg['SMTP_HOST'],
                port: parseInt(cfg['SMTP_PORT'] || '587', 10),
                secure: cfg['SMTP_SECURE'] === 'true',
                auth: {
                    user: cfg['SMTP_USER'],
                    pass: cfg['SMTP_PASS'],
                },
            });

            // Verify connection
            await transporter.verify();

            // Send test email
            const fromName = cfg['SMTP_FROM_NAME'] || 'وثيق';
            const fromEmail = cfg['SMTP_FROM'] || cfg['SMTP_USER'];

            await transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to: testEmail,
                subject: '✅ اختبار SMTP — وثيق',
                html: `
                <div dir="rtl" style="font-family:Arial,sans-serif;text-align:right;padding:20px;">
                    <h2 style="color:#10b981;">✅ اتصال SMTP يعمل بنجاح!</h2>
                    <p>تم إرسال هذه الرسالة كاختبار من لوحة تحكم السوبر أدمن.</p>
                    <table style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:16px 0;background:#f9fafb;">
                        <tr><td style="color:#6b7280;padding:4px 12px;">الخادم:</td><td style="font-weight:600;">${cfg['SMTP_HOST']}</td></tr>
                        <tr><td style="color:#6b7280;padding:4px 12px;">المنفذ:</td><td style="font-weight:600;">${cfg['SMTP_PORT'] || '587'}</td></tr>
                        <tr><td style="color:#6b7280;padding:4px 12px;">المرسل:</td><td style="font-weight:600;">${fromEmail}</td></tr>
                    </table>
                    <p style="color:#6b7280;font-size:13px;">نظام وثيق لإدارة مكاتب المحاماة</p>
                </div>`,
            });

            return {
                success: true,
                message: `تم إرسال بريد اختبار بنجاح إلى ${testEmail}`,
                details: { host: cfg['SMTP_HOST'], port: cfg['SMTP_PORT'] || '587', from: fromEmail },
            };
        } catch (e: any) {
            let errorMessage = e.message;
            if (e.code === 'ECONNREFUSED') errorMessage = 'تعذر الاتصال بخادم SMTP. تحقق من عنوان الخادم والمنفذ.';
            if (e.code === 'EAUTH') errorMessage = 'فشل المصادقة. تحقق من اسم المستخدم وكلمة المرور.';
            if (e.responseCode === 535) errorMessage = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
            return { success: false, error: errorMessage };
        }
    }

    private maskValue(value: string): string {
        if (value.length <= 8) return '••••••••';
        return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
    }
}
