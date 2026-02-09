import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';

// JWT Payload structure
export interface JwtPayload {
    sub: string;      // userId
    email: string;
    tenantId: string;
    role: UserRole;
}

@Injectable()
export class AuthService {
    private readonly SALT_ROUNDS = 10;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Register new tenant with owner user
     */
    async register(registerDto: RegisterDto) {
        const { email, password, name, officeName, phone } = registerDto;

        // Check if email already exists (user or tenant)
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

        // Hash password
        const hashedPassword = await this.hashPassword(password);

        // Create tenant and owner user in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Create tenant (law office)
            const tenant = await tx.tenant.create({
                data: {
                    name: officeName,
                    email,
                    phone,
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
                },
                include: {
                    tenant: { select: { id: true, name: true, isActive: true } },
                },
            });

            return { tenant, user };
        });

        // Generate JWT token
        const accessToken = this.generateToken(result.user);

        // Return user data without password
        const { password: _, ...userWithoutPassword } = result.user;

        return {
            accessToken,
            user: userWithoutPassword,
            message: 'تم إنشاء الحساب بنجاح',
        };
    }

    /**
     * Login user
     */
    async login(loginDto: LoginDto) {
        const { email, password, twoFactorToken } = loginDto;

        // Find user by email with tenant info
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { tenant: { select: { id: true, name: true, isActive: true } } },
        });

        if (!user) {
            throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new UnauthorizedException('الحساب معطل');
        }

        // Check if tenant is active
        if (!user.tenant.isActive) {
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

        return {
            accessToken,
            user: userWithoutPassword,
        };
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
                        email: true,
                        phone: true,
                        logo: true,
                        isActive: true,
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
            include: { tenant: { select: { id: true, name: true, isActive: true } } },
        });

        if (!user || !user.isActive || !user.tenant.isActive) {
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
    private generateToken(user: { id: string; email: string; tenantId: string; role: UserRole }): string {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
        };

        return this.jwtService.sign(payload);
    }
}
