import {
    Injectable,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class EmailVerificationService {
    private readonly logger = new Logger(EmailVerificationService.name);
    private readonly SALT_ROUNDS = 10;
    private readonly OTP_EXPIRY_MINUTES = 15;
    private readonly MAX_ATTEMPTS = 5;
    private readonly RESEND_COOLDOWN_SECONDS = 60;

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) { }

    /**
     * Generate a 6-digit OTP code
     */
    private generateOTPCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Generate OTP HTML email template
     */
    private getOTPEmailHtml(otpCode: string): string {
        return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding:32px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:800;">وثيق</h1>
              <p style="color:#e0e7ff; margin:8px 0 0; font-size:14px;">نظام إدارة المكاتب القانونية</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="color:#1e293b; margin:0 0 8px; font-size:20px; text-align:center;">تحقق من بريدك الإلكتروني</h2>
              <p style="color:#64748b; margin:0 0 32px; font-size:14px; text-align:center; line-height:1.6;">
                استخدم الرمز التالي لإكمال تسجيل حسابك في وثيق
              </p>
              
              <!-- OTP Box -->
              <div style="background:#f1f5f9; border:2px solid #e2e8f0; border-radius:12px; padding:24px; text-align:center; margin:0 0 24px;">
                <div style="font-size:48px; letter-spacing:16px; color:#4f46e5; font-weight:900; font-family:monospace;">
                  ${otpCode}
                </div>
              </div>

              <p style="color:#94a3b8; font-size:13px; text-align:center; margin:0 0 8px;">
                ⏱️ ينتهي هذا الرمز خلال <strong style="color:#ef4444;">${this.OTP_EXPIRY_MINUTES} دقيقة</strong>
              </p>
              
              <!-- Warning -->
              <div style="background:#fef3c7; border:1px solid #fbbf24; border-radius:8px; padding:12px 16px; margin:24px 0 0;">
                <p style="color:#92400e; margin:0; font-size:12px; line-height:1.5;">
                  ⚠️ لا تشارك هذا الرمز مع أي شخص. فريق وثيق لن يطلب منك هذا الرمز أبداً.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8; margin:0; font-size:11px; text-align:center;">
                © ${new Date().getFullYear()} وثيق — Wathiq. جميع الحقوق محفوظة.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }

    /**
     * Generate and send OTP to email
     */
    async generateAndSendOTP(email: string, tenantId?: string): Promise<void> {
        // Delete any existing unused tokens for this email
        await this.prisma.emailVerificationToken.deleteMany({
            where: { email, isUsed: false },
        });

        // Generate 6-digit OTP
        const otpCode = this.generateOTPCode();
        this.logger.log(`Generated OTP for ${email}`);

        // Hash the OTP with bcrypt before storing
        const hashedToken = await bcrypt.hash(otpCode, this.SALT_ROUNDS);

        // Save to DB with 15-minute expiry
        await this.prisma.emailVerificationToken.create({
            data: {
                email,
                tenantId,
                token: hashedToken,
                expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000),
            },
        });

        // Send email
        const html = this.getOTPEmailHtml(otpCode);
        const result = await this.emailService.sendEmail({
            to: email,
            subject: 'رمز التحقق من وثيق — Wathiq Verification Code',
            body: html,
        });

        if (!result.success) {
            this.logger.error(`Failed to send OTP email to ${email}: ${result.error}`);
            throw new BadRequestException('فشل إرسال رمز التحقق. يرجى المحاولة لاحقاً.');
        }
    }

    /**
     * Verify OTP code
     * Returns true if valid, throws on error
     */
    async verifyOTP(email: string, code: string): Promise<boolean> {
        // Find the latest valid token
        const verificationToken = await this.prisma.emailVerificationToken.findFirst({
            where: {
                email,
                isUsed: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!verificationToken) {
            throw new BadRequestException('الرمز غير صالح أو منتهي الصلاحية. يرجى طلب رمز جديد.');
        }

        // Check max attempts
        if (verificationToken.attempts >= this.MAX_ATTEMPTS) {
            // Delete the token — force resend
            await this.prisma.emailVerificationToken.delete({
                where: { id: verificationToken.id },
            });
            throw new BadRequestException('تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد.');
        }

        // Compare with bcrypt
        const isValid = await bcrypt.compare(code, verificationToken.token);

        if (!isValid) {
            // Increment attempts
            const updated = await this.prisma.emailVerificationToken.update({
                where: { id: verificationToken.id },
                data: { attempts: { increment: 1 } },
            });

            const remaining = this.MAX_ATTEMPTS - updated.attempts;
            if (remaining <= 0) {
                await this.prisma.emailVerificationToken.delete({
                    where: { id: verificationToken.id },
                });
                throw new BadRequestException('تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد.');
            }

            throw new BadRequestException(`الرمز غير صحيح. لديك ${remaining} محاولات متبقية.`);
        }

        // Mark as used
        await this.prisma.emailVerificationToken.update({
            where: { id: verificationToken.id },
            data: { isUsed: true },
        });

        // Activate the tenant if tenantId exists
        if (verificationToken.tenantId) {
            await this.prisma.tenant.update({
                where: { id: verificationToken.tenantId },
                data: {
                    registrationStatus: 'ACTIVE',
                    isActive: true,
                    emailVerifiedAt: new Date(),
                },
            });
        }

        return true;
    }

    /**
     * Resend OTP with cooldown enforcement
     */
    async resendOTP(email: string): Promise<{ waitSeconds: number }> {
        // Find the latest token for this email
        const lastToken = await this.prisma.emailVerificationToken.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' },
        });

        if (lastToken) {
            const secondsSinceCreated = Math.floor(
                (Date.now() - lastToken.createdAt.getTime()) / 1000
            );

            if (secondsSinceCreated < this.RESEND_COOLDOWN_SECONDS) {
                const waitSeconds = this.RESEND_COOLDOWN_SECONDS - secondsSinceCreated;
                return { waitSeconds };
            }
        }

        // Find tenantId from the pending tenant with this email
        const tenant = await this.prisma.tenant.findFirst({
            where: { email, registrationStatus: 'PENDING_EMAIL' },
            select: { id: true },
        });

        // Delete old tokens and send new one
        await this.generateAndSendOTP(email, tenant?.id);

        return { waitSeconds: 0 };
    }
}
