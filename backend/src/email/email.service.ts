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
     * Get transporter for a specific tenant (uses tenant SMTP settings if available)
     */
    private async getTransporter(tenantId?: string): Promise<nodemailer.Transporter> {
        // Try to get tenant-specific SMTP settings
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

        // Fallback to default SMTP from environment
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
}
