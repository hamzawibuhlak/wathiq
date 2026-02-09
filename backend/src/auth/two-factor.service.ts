import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate 2FA secret and QR code for user
     */
    async generateSecret(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true },
        });

        if (!user) {
            throw new BadRequestException('المستخدم غير موجود');
        }

        if (user.twoFactorEnabled) {
            throw new BadRequestException('المصادقة الثنائية مفعلة بالفعل');
        }

        // Generate new secret
        const secret = speakeasy.generateSecret({
            name: `Watheeq - ${user.tenant.name}`,
            issuer: 'Watheeq',
            length: 20,
        });

        // Store secret temporarily (not enabled until verified)
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 },
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        return {
            secret: secret.base32,
            qrCode: qrCodeUrl,
            manualEntry: secret.base32,
        };
    }

    /**
     * Enable 2FA after verifying token
     */
    async enable(userId: string, token: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('المستخدم غير موجود');
        }

        if (!user.twoFactorSecret) {
            throw new BadRequestException('يرجى إنشاء سر المصادقة الثنائية أولاً');
        }

        if (user.twoFactorEnabled) {
            throw new BadRequestException('المصادقة الثنائية مفعلة بالفعل');
        }

        // Verify the token
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 1, // Allow 1 step before/after for time drift
        });

        if (!isValid) {
            throw new UnauthorizedException('رمز المصادقة غير صحيح');
        }

        // Generate backup codes
        const backupCodes = this.generateBackupCodes(8);

        // Enable 2FA
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                twoFactorBackupCodes: backupCodes,
            },
        });

        return {
            success: true,
            message: 'تم تفعيل المصادقة الثنائية بنجاح',
            backupCodes,
        };
    }

    /**
     * Disable 2FA
     */
    async disable(userId: string, token: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('المستخدم غير موجود');
        }

        if (!user.twoFactorEnabled) {
            throw new BadRequestException('المصادقة الثنائية غير مفعلة');
        }

        // Verify the token
        const isValid = await this.verifyToken(userId, token);
        if (!isValid) {
            throw new UnauthorizedException('رمز المصادقة غير صحيح');
        }

        // Disable 2FA
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorBackupCodes: [],
            },
        });

        return {
            success: true,
            message: 'تم إلغاء المصادقة الثنائية بنجاح',
        };
    }

    /**
     * Verify 2FA token (for login)
     */
    async verifyToken(userId: string, token: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.twoFactorSecret) {
            return false;
        }

        // First try TOTP verification
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 1,
        });

        if (isValid) {
            return true;
        }

        // Try backup codes
        if (user.twoFactorBackupCodes.includes(token)) {
            // Remove used backup code
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorBackupCodes: user.twoFactorBackupCodes.filter(code => code !== token),
                },
            });
            return true;
        }

        return false;
    }

    /**
     * Check if user has 2FA enabled
     */
    async has2FAEnabled(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorEnabled: true },
        });

        return user?.twoFactorEnabled ?? false;
    }

    /**
     * Generate new backup codes
     */
    async regenerateBackupCodes(userId: string, token: string) {
        const isValid = await this.verifyToken(userId, token);
        if (!isValid) {
            throw new UnauthorizedException('رمز المصادقة غير صحيح');
        }

        const backupCodes = this.generateBackupCodes(8);

        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorBackupCodes: backupCodes },
        });

        return { backupCodes };
    }

    /**
     * Generate random backup codes
     */
    private generateBackupCodes(count: number): string[] {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric code
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            codes.push(code);
        }
        return codes;
    }
}
