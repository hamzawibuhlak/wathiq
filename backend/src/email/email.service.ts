import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) { }

    /**
     * Read SMTP config from SystemConfig table (set via Super Admin UI)
     */
    private async getSystemSmtpConfig(): Promise<Record<string, string>> {
        try {
            const configs = await this.prisma.systemConfig.findMany({
                where: { category: 'smtp' },
            });
            const map: Record<string, string> = {};
            configs.forEach(c => { map[c.key] = c.value; });
            return map;
        } catch {
            return {};
        }
    }

    /**
     * Get transporter for a specific tenant (uses tenant SMTP settings if available)
     * Priority: 1) Tenant SMTP → 2) SystemConfig SMTP → 3) env vars
     */
    private async getTransporter(tenantId?: string): Promise<nodemailer.Transporter> {
        // 1. Try tenant-specific SMTP settings
        if (tenantId) {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: {
                    smtpHost: true,
                    smtpPort: true,
                    smtpUser: true,
                    smtpPass: true,
                    smtpSecure: true,
                    smtpEnabled: true,
                },
            });

            if (tenant?.smtpEnabled && tenant.smtpHost && tenant.smtpUser && tenant.smtpPass) {
                return nodemailer.createTransport({
                    host: tenant.smtpHost,
                    port: tenant.smtpPort || 587,
                    secure: tenant.smtpSecure || false,
                    auth: {
                        user: tenant.smtpUser,
                        pass: tenant.smtpPass,
                    },
                });
            }
        }

        // 2. Try SystemConfig SMTP (set via Super Admin UI)
        const sysSmtp = await this.getSystemSmtpConfig();
        if (sysSmtp['SMTP_HOST'] && sysSmtp['SMTP_USER'] && sysSmtp['SMTP_PASS']) {
            return nodemailer.createTransport({
                host: sysSmtp['SMTP_HOST'],
                port: parseInt(sysSmtp['SMTP_PORT'] || '587', 10),
                secure: sysSmtp['SMTP_SECURE'] === 'true',
                auth: {
                    user: sysSmtp['SMTP_USER'],
                    pass: sysSmtp['SMTP_PASS'],
                },
            });
        }

        // 3. Fallback to default SMTP from environment variables
        return nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
            port: this.configService.get('SMTP_PORT', 587),
            secure: false,
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
    }

    /**
     * Get "from" address for a tenant
     * Priority: 1) Tenant → 2) SystemConfig → 3) env vars
     */
    private async getFromAddress(tenantId?: string): Promise<string> {
        if (tenantId) {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: {
                    name: true,
                    smtpFrom: true,
                    smtpFromName: true,
                    smtpUser: true,
                    smtpEnabled: true,
                },
            });

            if (tenant?.smtpEnabled && (tenant.smtpFrom || tenant.smtpUser)) {
                const fromName = tenant.smtpFromName || tenant.name || 'وثيق';
                const fromEmail = tenant.smtpFrom || tenant.smtpUser;
                return `"${fromName}" <${fromEmail}>`;
            }
        }

        // Check SystemConfig
        const sysSmtp = await this.getSystemSmtpConfig();
        if (sysSmtp['SMTP_FROM'] || sysSmtp['SMTP_USER']) {
            const fromName = sysSmtp['SMTP_FROM_NAME'] || 'وثيق';
            const fromEmail = sysSmtp['SMTP_FROM'] || sysSmtp['SMTP_USER'];
            return `"${fromName}" <${fromEmail}>`;
        }

        return this.configService.get('SMTP_FROM', 'noreply@watheeq.sa');
    }

    /**
     * Send generic email
     */
    async sendEmail(data: {
        to: string;
        subject: string;
        body: string;
        tenantId?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const transporter = await this.getTransporter(data.tenantId);
            const from = await this.getFromAddress(data.tenantId);

            const mailOptions = {
                from,
                to: data.to,
                subject: data.subject,
                html: data.body,
            };

            await transporter.sendMail(mailOptions);
            this.logger.log(`Email sent to ${data.to}`);
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to send email:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send hearing reminder email to client
     */
    async sendHearingReminder(data: {
        to: string;
        clientName: string;
        hearingDate: Date;
        courtName: string;
        caseTitle: string;
        caseNumber: string;
        tenantId?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const transporter = await this.getTransporter(data.tenantId);
            const from = await this.getFromAddress(data.tenantId);

            const formattedDate = new Intl.DateTimeFormat('ar-SA', {
                dateStyle: 'full',
                timeStyle: 'short',
            }).format(new Date(data.hearingDate));

            // Get tenant logo
            let logoHtml = '';
            let firmName = 'وثيق';
            if (data.tenantId) {
                const tenant = await this.prisma.tenant.findUnique({
                    where: { id: data.tenantId },
                    select: { logo: true, name: true },
                });
                if (tenant?.name) firmName = tenant.name;
                if (tenant?.logo) {
                    const logoUrl = tenant.logo.startsWith('http') ? tenant.logo : `https://bewathiq.com${tenant.logo}`;
                    logoHtml = `<img src="${logoUrl}" alt="${tenant.name}" style="max-height:50px;max-width:150px;margin-bottom:10px;">`;
                }
            }

            const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:Arial,Tahoma,sans-serif;line-height:1.8;color:#1f2937;background:#f3f4f6;margin:0;padding:20px;direction:rtl;text-align:right;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr>
<td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:white;padding:30px;text-align:center;">
${logoHtml}
<h2 style="margin:0;font-size:24px;font-weight:600;">تذكير بجلسة قضائية</h2>
</td>
</tr>
<tr>
<td style="padding:30px;direction:rtl;text-align:right;">
<p style="font-size:18px;margin:0 0 20px 0;text-align:right;">عزيزي/عزيزتي <strong>${data.clientName}</strong>،</p>
<p style="margin:0 0 20px 0;text-align:right;">نود تذكيركم بموعد جلستكم القضائية القادمة:</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:20px 0;">
<tr>
<td style="padding:15px;border-bottom:1px solid #e5e7eb;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="text-align:right;color:#6b7280;font-size:13px;font-weight:600;">القضية</td>
</tr>
<tr>
<td style="text-align:right;color:#111827;font-size:15px;font-weight:500;padding-top:4px;">${data.caseTitle}</td>
</tr>
<tr>
<td style="text-align:right;color:#6b7280;font-size:13px;padding-top:2px;">رقم: ${data.caseNumber}</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:15px;border-bottom:1px solid #e5e7eb;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="text-align:right;color:#6b7280;font-size:13px;font-weight:600;">التاريخ والوقت</td>
</tr>
<tr>
<td style="text-align:right;color:#111827;font-size:15px;font-weight:500;padding-top:4px;">${formattedDate}</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:15px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="text-align:right;color:#6b7280;font-size:13px;font-weight:600;">المحكمة</td>
</tr>
<tr>
<td style="text-align:right;color:#111827;font-size:15px;font-weight:500;padding-top:4px;">${data.courtName || 'سيتم تحديدها'}</td>
</tr>
</table>
</td>
</tr>
</table>
<p style="text-align:center;color:#dc2626;font-size:15px;margin:25px 0;font-weight:500;">يرجى الحضور في الموعد المحدد وإحضار جميع المستندات المطلوبة.</p>
<p style="margin-top:30px;text-align:right;">مع تحيات فريق المكتب</p>
</td>
</tr>
<tr>
<td style="background:#f9fafb;text-align:center;padding:20px;border-top:1px solid #e5e7eb;">
<div style="font-size:18px;font-weight:700;color:#2563eb;margin-bottom:8px;">${firmName}</div>
<p style="margin:0;color:#6b7280;font-size:13px;">نظام وثيق لإدارة مكاتب المحاماة</p>
</td>
</tr>
</table>
</body>
</html>`;

            const mailOptions = {
                from,
                to: data.to,
                subject: `تذكير بجلسة قضائية - ${data.caseTitle}`,
                html: htmlContent,
            };

            await transporter.sendMail(mailOptions);
            this.logger.log(`Hearing reminder sent to ${data.to}`);
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to send hearing reminder:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send invoice email to client (alias for sendInvoice)
     */
    async sendInvoice(data: {
        to: string;
        clientName: string;
        invoiceNumber: string;
        amount: number;
        dueDate: Date | null;
        firmName: string;
        caseTitle?: string;
        tenantId?: string;
    }): Promise<{ success: boolean; error?: string }> {
        return this.sendInvoiceEmail({
            to: data.to,
            clientName: data.clientName,
            invoiceNumber: data.invoiceNumber,
            amount: data.amount,
            dueDate: data.dueDate || new Date(),
            firmName: data.firmName,
            caseTitle: data.caseTitle,
            tenantId: data.tenantId,
        });
    }

    /**
     * Send invoice email to client
     */
    async sendInvoiceEmail(data: {
        to: string;
        clientName: string;
        invoiceNumber: string;
        amount: number;
        dueDate: Date;
        firmName?: string;
        caseTitle?: string;
        tenantId?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const transporter = await this.getTransporter(data.tenantId);
            const from = await this.getFromAddress(data.tenantId);

            // Get tenant logo
            let logoHtml = '';
            if (data.tenantId) {
                const tenant = await this.prisma.tenant.findUnique({
                    where: { id: data.tenantId },
                    select: { logo: true, name: true },
                });
                if (tenant?.logo) {
                    const logoUrl = tenant.logo.startsWith('http') ? tenant.logo : `https://bewathiq.com${tenant.logo}`;
                    logoHtml = `<img src="${logoUrl}" alt="${tenant.name}" style="max-height:50px;max-width:150px;margin-bottom:10px;">`;
                }
            }

            const formattedDueDate = new Intl.DateTimeFormat('ar-SA', { dateStyle: 'long' }).format(new Date(data.dueDate));
            const firmName = data.firmName || 'مكتب المحاماة';
            const formattedAmount = data.amount.toLocaleString('ar-SA');

            const caseRow = data.caseTitle ? `
<tr>
<td style="padding:12px 15px;border-bottom:1px solid #e5e7eb;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="text-align:right;color:#6b7280;">القضية</td>
<td style="text-align:left;font-weight:600;color:#111827;">${data.caseTitle}</td>
</tr>
</table>
</td>
</tr>` : '';

            const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:Arial,Tahoma,sans-serif;line-height:1.6;color:#333;background:#f3f4f6;margin:0;padding:20px;direction:rtl;text-align:right;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl" style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr>
<td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:25px;text-align:center;">
${logoHtml}
<h2 style="margin:0;font-size:22px;">فاتورة جديدة</h2>
</td>
</tr>
<tr>
<td style="padding:25px;direction:rtl;text-align:right;">
<p style="font-size:15px;text-align:right;margin:0 0 15px 0;">عزيزي/عزيزتي <strong>${data.clientName}</strong>،</p>
<p style="text-align:right;margin:0 0 20px 0;">تم إصدار فاتورة جديدة باسمكم من <strong>${firmName}</strong>:</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:15px 0;">
<tr>
<td style="padding:12px 15px;border-bottom:1px solid #e5e7eb;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="text-align:right;color:#6b7280;">رقم الفاتورة</td>
<td style="text-align:left;font-weight:600;color:#111827;">${data.invoiceNumber}</td>
</tr>
</table>
</td>
</tr>
${caseRow}
<tr>
<td style="padding:12px 15px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="text-align:right;color:#6b7280;">تاريخ الاستحقاق</td>
<td style="text-align:left;font-weight:600;color:#111827;">${formattedDueDate}</td>
</tr>
</table>
</td>
</tr>
</table>
<div style="font-size:32px;font-weight:bold;color:#10b981;text-align:center;margin:25px 0;direction:ltr;">
${formattedAmount} ر.س
</div>
<p style="text-align:center;color:#4b5563;margin:20px 0;">يرجى سداد المبلغ قبل تاريخ الاستحقاق.</p>
</td>
</tr>
<tr>
<td style="background:#f9fafb;text-align:center;padding:20px;border-top:1px solid #e5e7eb;">
<div style="font-size:18px;font-weight:700;color:#10b981;margin-bottom:8px;">${firmName}</div>
<p style="margin:0;color:#6b7280;font-size:12px;">نظام وثيق لإدارة مكاتب المحاماة</p>
</td>
</tr>
</table>
</body>
</html>`;

            const mailOptions = {
                from,
                to: data.to,
                subject: `فاتورة جديدة - ${data.invoiceNumber} - ${firmName}`,
                html: htmlContent,
            };

            await transporter.sendMail(mailOptions);
            this.logger.log(`Invoice email sent to ${data.to}`);
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to send invoice email:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Send password reset email
     */
    async sendPasswordReset(data: {
        to: string;
        resetToken: string;
        tenantId?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const transporter = await this.getTransporter(data.tenantId);
            const from = await this.getFromAddress(data.tenantId);

            // In a real app, this would link to the frontend reset page
            // For MVP/Demo, we might just send a temporary password or a link
            // Assuming we have a reset page: /reset-password?token=...
            // But user asked for "change password message comes from API email"
            // Let's assume a link to frontend

            const resetLink = `${this.configService.get('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token=${data.resetToken}`;

            const htmlContent = `
            <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
                <h2>إعادة تعيين كلمة المرور</h2>
                <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.</p>
                <p>اضغط على الرابط أدناه لتعيين كلمة مرور جديدة:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">إعادة تعيين كلمة المرور</a>
                <p>إذا لم تطلب هذا التغيير، يمكنك تجاهل هذه الرسالة.</p>
            </div>
            `;

            const mailOptions = {
                from,
                to: data.to,
                subject: 'إعادة تعيين كلمة المرور - وثيق',
                html: htmlContent,
            };

            await transporter.sendMail(mailOptions);
            this.logger.log(`Password reset email sent to ${data.to}`);
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to send password reset email:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send user invitation email
     */
    async sendInvitation(data: {
        to: string;
        inviterName: string;
        tenantName: string;
        role: string;
        token: string;
        tenantId?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const transporter = await this.getTransporter(data.tenantId);
            const from = await this.getFromAddress(data.tenantId);

            const roleLabels: Record<string, string> = {
                OWNER: 'مالك',
                ADMIN: 'مدير',
                LAWYER: 'محامي',
                SECRETARY: 'سكرتير',
            };

            const roleLabel = roleLabels[data.role] || data.role;
            const invitationLink = `${this.configService.get('FRONTEND_URL', 'https://bewathiq.com')}/invitation/${data.token}`;

            const htmlContent = `
            <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">وثيق</h1>
                    <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">منصة إدارة المكاتب القانونية</p>
                </div>

                <!-- Body -->
                <div style="padding: 32px;">
                    <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0;">مرحباً،</h2>
                    
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 16px 0;">
                        تمت دعوتك من قبل <strong style="color: #1f2937;">${data.inviterName}</strong> 
                        للانضمام إلى <strong style="color: #1e40af;">${data.tenantName}</strong> 
                        كـ<strong style="color: #1f2937;">${roleLabel}</strong> على منصة وثيق.
                    </p>

                    <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 24px 0;">
                        اضغط على الزر أدناه لإنشاء حسابك وتعيين كلمة المرور:
                    </p>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${invitationLink}" 
                           style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(30, 64, 175, 0.25);">
                            إنشاء حسابي
                        </a>
                    </div>

                    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
                        <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.6;">
                            ⏰ هذه الدعوة صالحة لمدة <strong>7 أيام</strong> من تاريخ الإرسال.
                        </p>
                    </div>

                    <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0 0;">
                        إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة.
                    </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} وثيق - جميع الحقوق محفوظة
                    </p>
                </div>
            </div>
            `;

            const mailOptions = {
                from,
                to: data.to,
                subject: `دعوة للانضمام إلى ${data.tenantName} على منصة وثيق`,
                html: htmlContent,
            };

            await transporter.sendMail(mailOptions);
            this.logger.log(`Invitation email sent to ${data.to}`);
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to send invitation email:', error);
            return { success: false, error: error.message };
        }
    }
}
