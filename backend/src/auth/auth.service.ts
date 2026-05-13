import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';
import { EmailService } from '../email/email.service';

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
}

@Injectable()
export class AuthService {
    private readonly SALT_ROUNDS = 10;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password, twoFactorToken } = loginDto;

        const user = await this.prisma.user.findUnique({
            where: { email } });

        if (!user) {
            throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('الحساب معطل');
        }

        const isPasswordValid = await this.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        if ((user as any).twoFactorEnabled) {
            if (!twoFactorToken) {
                return {
                    requiresTwoFactor: true,
                    message: 'يرجى إدخال رمز المصادقة الثنائية' };
            }

            const speakeasy = await import('speakeasy');
            const isValid = speakeasy.totp.verify({
                secret: (user as any).twoFactorSecret,
                encoding: 'base32',
                token: twoFactorToken,
                window: 1 });

            if (!isValid) {
                const backupCodes = (user as any).twoFactorBackupCodes || [];
                if (!backupCodes.includes(twoFactorToken)) {
                    throw new UnauthorizedException('رمز المصادقة الثنائية غير صحيح');
                }
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        twoFactorBackupCodes: backupCodes.filter((code: string) => code !== twoFactorToken) } as any });
            }
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() } });

        const accessToken = this.generateToken(user);
        const { password: _, ...userWithoutPassword } = user;

        return {
            accessToken,
            user: userWithoutPassword,
            redirectTo: '/dashboard' };
    }

    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email } });

        if (!user) {
            return { message: 'إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال رابط إعادة التعيين إليه.' };
        }

        const resetToken = this.jwtService.sign(
            { sub: user.id, purpose: 'reset-password' },
            { expiresIn: '1h' }
        );

        await this.emailService.sendPasswordReset({
            to: email,
            resetToken });

        return { message: 'تم إرسال رابط إعادة التعيين بنجاح' };
    }

    async changePassword(userId: string, data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
        if (data.newPassword !== data.confirmPassword) {
            throw new BadRequestException('كلمة المرور الجديدة وتأكيدها غير متطابقتين');
        }

        if (data.newPassword.length < 6) {
            throw new BadRequestException('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('المستخدم غير موجود');
        }

        const isCurrentValid = await this.comparePassword(data.currentPassword, user.password);
        if (!isCurrentValid) {
            throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
        }

        const hashedNew = await this.hashPassword(data.newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedNew } });

        return { message: 'تم تغيير كلمة المرور بنجاح' };
    }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                avatar: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true } });

        if (!user) {
            throw new NotFoundException('المستخدم غير موجود');
        }

        return { data: user };
    }

    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { updatedAt: new Date() } });

        return { message: 'تم تسجيل الخروج بنجاح' };
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId } });

        if (!user || !user.isActive) {
            return null;
        }

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    private generateToken(user: { id: string; email: string; role: UserRole }): string {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role };

        return this.jwtService.sign(payload);
    }
}
