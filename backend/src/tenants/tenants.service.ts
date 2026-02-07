import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateSmtpSettingsDto, TestEmailDto } from './dto/update-smtp-settings.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class TenantsService {
    constructor(private readonly prisma: PrismaService) { }

    async findOne(id: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
        });

        if (!tenant) {
            throw new NotFoundException('المكتب غير موجود');
        }

        return { data: tenant };
    }

    async update(id: string, dto: UpdateTenantDto) {
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: dto,
        });

        return { data: tenant, message: 'تم تحديث معلومات المكتب بنجاح' };
    }

    /**
     * Get SMTP settings for a tenant
     */
    async getSmtpSettings(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpPass: true,
                smtpFrom: true,
                smtpFromName: true,
                smtpSecure: true,
                smtpEnabled: true,
            },
        });

        if (!tenant) {
            throw new NotFoundException('المكتب غير موجود');
        }

        // Mask password for security
        return {
            data: {
                ...tenant,
                smtpPass: tenant.smtpPass ? '••••••••' : null,
                hasPassword: !!tenant.smtpPass,
            },
        };
    }

    /**
     * Update SMTP settings
     */
    async updateSmtpSettings(tenantId: string, dto: UpdateSmtpSettingsDto) {
        // If password is masked or empty, don't update it
        const updateData: any = { ...dto };
        if (!dto.smtpPass || dto.smtpPass === '••••••••') {
            delete updateData.smtpPass;
        }

        const tenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: updateData,
            select: {
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpFrom: true,
                smtpFromName: true,
                smtpSecure: true,
                smtpEnabled: true,
            },
        });

        return {
            data: tenant,
            message: 'تم تحديث إعدادات البريد الإلكتروني بنجاح',
        };
    }

    /**
     * Test SMTP connection and send test email
     */
    async testSmtpConnection(tenantId: string, dto: TestEmailDto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                name: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpPass: true,
                smtpFrom: true,
                smtpFromName: true,
                smtpSecure: true,
            },
        });

        if (!tenant) {
            throw new NotFoundException('المكتب غير موجود');
        }

        if (!tenant.smtpHost || !tenant.smtpUser || !tenant.smtpPass) {
            throw new BadRequestException('إعدادات SMTP غير مكتملة. يرجى إدخال جميع الحقول المطلوبة.');
        }

        try {
            // Create transporter with tenant settings
            const transporter = nodemailer.createTransport({
                host: tenant.smtpHost,
                port: tenant.smtpPort || 587,
                secure: tenant.smtpSecure || false,
                auth: {
                    user: tenant.smtpUser,
                    pass: tenant.smtpPass,
                },
                connectionTimeout: 10000, // 10 seconds
            });

            // Verify connection
            await transporter.verify();

            // Send test email
            await transporter.sendMail({
                from: `"${tenant.smtpFromName || tenant.name}" <${tenant.smtpFrom || tenant.smtpUser}>`,
                to: dto.testEmail,
                subject: '✅ اختبار إعدادات البريد - وثيق',
                html: `
                    <!DOCTYPE html>
                    <html dir="rtl" lang="ar">
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f3f4f6; padding: 20px; }
                            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
                            .content { padding: 30px; text-align: center; }
                            .success-icon { font-size: 48px; margin-bottom: 20px; }
                            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h2>اختبار البريد الإلكتروني</h2>
                            </div>
                            <div class="content">
                                <div class="success-icon">✅</div>
                                <h3>تم الاتصال بنجاح!</h3>
                                <p>إعدادات SMTP تعمل بشكل صحيح.</p>
                                <p style="color: #6b7280; font-size: 14px;">
                                    <strong>السيرفر:</strong> ${tenant.smtpHost}<br>
                                    <strong>المنفذ:</strong> ${tenant.smtpPort || 587}
                                </p>
                            </div>
                            <div class="footer">
                                <strong>⚖️ ${tenant.name}</strong><br>
                                نظام وثيق لإدارة مكاتب المحاماة
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            });

            return {
                success: true,
                message: `تم إرسال رسالة اختبار بنجاح إلى ${dto.testEmail}`,
            };
        } catch (error) {
            let errorMessage = 'فشل الاتصال بخادم البريد الإلكتروني';
            
            if (error.code === 'ECONNREFUSED') {
                errorMessage = 'تعذر الاتصال بخادم SMTP. تحقق من عنوان الخادم والمنفذ.';
            } else if (error.code === 'EAUTH') {
                errorMessage = 'فشل المصادقة. تحقق من اسم المستخدم وكلمة المرور.';
            } else if (error.code === 'ETIMEDOUT') {
                errorMessage = 'انتهت مهلة الاتصال. تحقق من إعدادات الشبكة والجدار الناري.';
            } else if (error.responseCode === 535) {
                errorMessage = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
            }

            throw new BadRequestException(errorMessage);
        }
    }
}
