import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { EntityCodeService } from '../common/services/entity-code.service';

// JWT Payload structure
export interface JwtPayload {
    sub: string;      // userId
    email: string;
    tenantId: string | null;
    tenantSlug: string | null;
    role: UserRole;
}

// Reserved slugs that cannot be used
const RESERVED_SLUGS = [
    'admin', 'api', 'www', 'app', 'login', 'register',
    'dashboard', 'owner', 'settings', 'support', 'help',
    'billing', 'pricing', 'about', 'contact', 'blog',
    'portal', 'super-admin', 'invitation', 'auth',
];

@Injectable()
export class AuthService {
    private readonly SALT_ROUNDS = 10;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly entityCodeService: EntityCodeService,
    ) { }

    /**
     * Check if a slug is available
     */
    async checkSlugAvailability(slug: string): Promise<{ available: boolean; message?: string }> {
        const normalizedSlug = slug.toLowerCase().trim();

        if (RESERVED_SLUGS.includes(normalizedSlug)) {
            return { available: false, message: 'اسم الرابط محجوز' };
        }

        if (normalizedSlug.length < 3) {
            return { available: false, message: 'اسم الرابط قصير جداً' };
        }

        const existing = await this.prisma.tenant.findUnique({
            where: { slug: normalizedSlug },
        });

        return {
            available: !existing,
            message: existing ? 'اسم الرابط مستخدم بالفعل' : undefined,
        };
    }

    /**
     * Register new tenant with owner user
     */
    async register(registerDto: RegisterDto) {
        const { email, password, name, officeName, slug, city, licenseNumber, phone, planType } = registerDto;

        // 1. Check slug availability
        const { available } = await this.checkSlugAvailability(slug);
        if (!available) {
            throw new BadRequestException('اسم الرابط محجوز، يرجى اختيار اسم آخر');
        }

        // 2. Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
        }

        const existingTenant = await this.prisma.tenant.findUnique({
            where: { email },
        });

        if (existingTenant) {
            throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
        }

        // 3. Hash password
        const hashedPassword = await this.hashPassword(password);

        // 4. Generate entity codes
        const tenantCode = this.entityCodeService.generateTenantCode(slug.toLowerCase());

        // 5. Create tenant and owner user in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Create tenant (law office)
            const tenant = await tx.tenant.create({
                data: {
                    name: officeName,
                    slug: slug.toLowerCase(),
                    email,
                    phone,
                    city,
                    licenseNumber,
                    planType: (planType as any) || 'BASIC',
                    planStartDate: new Date(),
                    planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
                    code: tenantCode.code,
                    codePrefix: tenantCode.codePrefix,
                },
            });

            // Create owner user
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    phone,
                    role: UserRole.OWNER,
                    tenantId: tenant.id,
                    code: `${tenantCode.codePrefix}_US0001`,
                    codeNumber: 1,
                },
                include: {
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            isActive: true,
                            planType: true,
                        },
                    },
                },
            });

            return { tenant, user };
        });

        // 5. Generate JWT token
        const accessToken = this.generateToken(result.user);

        // Return user data without password
        const { password: _, ...userWithoutPassword } = result.user;

        return {
            accessToken,
            user: userWithoutPassword,
            redirectTo: `/${result.tenant.slug}/dashboard`,
            message: 'تم إنشاء الحساب بنجاح',
        };
    }

    /**
     * Login user
     */
    async login(loginDto: LoginDto) {
        const { email, password, twoFactorToken, companyName } = loginDto;

        // Find user by email with tenant info
        // Note: In a multi-tenant system with companyName, we should verify the tenant matches
        // But login logic usually allows email/password uniqueness or login by email
        // If companyName is provided, we could optionally validate it

        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
                        planType: true,
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        // Validate Company Name if provided
        if (companyName && user.tenant && user.tenant.name !== companyName) {
            // For now, we won't block login, but we could. 
            // Or maybe the user meant "Office Name" which maps to Tenant Name
            // Let's just proceed as the requirement was to ADD the field.
        }

        // Check if user is active
        if (!user.isActive) {
            throw new UnauthorizedException('الحساب معطل');
        }

        // Check if tenant is active (skip for SUPER_ADMIN)
        if (user.tenant && !user.tenant.isActive) {
            throw new UnauthorizedException('المكتب معطل');
        }

        // Verify password
        const isPasswordValid = await this.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        // Check 2FA if enabled
        if ((user as any).twoFactorEnabled) {
            if (!twoFactorToken) {
                return {
                    requiresTwoFactor: true,
                    message: 'يرجى إدخال رمز المصادقة الثنائية',
                };
            }

            // Verify 2FA token using speakeasy
            const speakeasy = await import('speakeasy');
            const isValid = speakeasy.totp.verify({
                secret: (user as any).twoFactorSecret,
                encoding: 'base32',
                token: twoFactorToken,
                window: 1,
            });

            if (!isValid) {
                // Check backup codes
                const backupCodes = (user as any).twoFactorBackupCodes || [];
                if (!backupCodes.includes(twoFactorToken)) {
                    throw new UnauthorizedException('رمز المصادقة الثنائية غير صحيح');
                }
                // Remove used backup code
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        twoFactorBackupCodes: backupCodes.filter((code: string) => code !== twoFactorToken),
                    } as any,
                });
            }
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate JWT token
        const accessToken = this.generateToken(user);

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;

        // Build redirect URL based on role and tenant slug
        const tenantSlug = user.tenant?.slug;
        let redirectTo = '/dashboard';
        if (tenantSlug) {
            redirectTo = user.role === 'OWNER'
                ? `/${tenantSlug}/owner`
                : `/${tenantSlug}/dashboard`;
        } else if (user.role === 'SUPER_ADMIN') {
            redirectTo = '/super-admin';
        }

        return {
            accessToken,
            user: userWithoutPassword,
            redirectTo,
        };
    }

    /**
     * Forgot Password
     */
    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Do not reveal if user exists
            return { message: 'إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال رابط إعادة التعيين إليه.' };
        }

        // Generate reset token (simple implementation for MVP)
        // In production, save to DB with expiration
        const resetToken = this.jwtService.sign(
            { sub: user.id, purpose: 'reset-password' },
            { expiresIn: '1h' }
        );

        // Send email
        await this.emailService.sendPasswordReset({
            to: email,
            resetToken,
            tenantId: user.tenantId || undefined,
        });

        return { message: 'تم إرسال رابط إعادة التعيين بنجاح' };
    }


    /**
     * Change password for authenticated user
     */
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
            data: { password: hashedNew },
        });

        return { message: 'تم تغيير كلمة المرور بنجاح' };
    }

    /**
     * Get current user data
     */
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
                createdAt: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        nameEn: true,
                        slug: true,
                        email: true,
                        phone: true,
                        logo: true,
                        isActive: true,
                        planType: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('المستخدم غير موجود');
        }

        return { data: user };
    }

    /**
     * Logout user (for token blacklist if implemented)
     */
    async logout(userId: string) {
        // In a stateless JWT setup, logout is handled client-side
        // This endpoint can be used for token blacklisting or logging

        // Log the logout event (optional)
        await this.prisma.user.update({
            where: { id: userId },
            data: { updatedAt: new Date() },
        });

        return { message: 'تم تسجيل الخروج بنجاح' };
    }

    /**
     * Validate user from JWT payload (used by JwtStrategy)
     */
    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
                        planType: true,
                    },
                },
            },
        });

        if (!user || !user.isActive || (user.tenant && !user.tenant.isActive)) {
            return null;
        }

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    /**
     * Hash password using bcrypt
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    /**
     * Compare password with hash
     */
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Generate JWT token
     */
    private generateToken(user: {
        id: string;
        email: string;
        tenantId: string | null;
        role: UserRole;
        tenant?: { slug: string } | null;
    }): string {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            tenantSlug: user.tenant?.slug || null,
            role: user.role,
        };

        return this.jwtService.sign(payload);
    }
}
