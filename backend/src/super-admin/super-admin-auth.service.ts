import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminAuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async login(email: string, password: string) {
        const admin = await this.prisma.superAdminUser.findUnique({ where: { email } });

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            throw new UnauthorizedException('بيانات الدخول غير صحيحة');
        }

        if (!admin.isActive) {
            throw new ForbiddenException('الحساب موقوف');
        }

        await this.prisma.superAdminUser.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });

        const token = this.jwtService.sign(
            {
                sub: admin.id,
                email: admin.email,
                role: admin.role,
                customRoleId: admin.customRoleId,
                name: admin.name,
                type: 'SUPER_ADMIN',
            },
            {
                secret: process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET,
                expiresIn: '12h',
            },
        );

        return {
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                customRoleId: admin.customRoleId,
            },
        };
    }

    async getMe(adminId: string) {
        const admin = await this.prisma.superAdminUser.findUnique({
            where: { id: adminId },
            select: {
                id: true, name: true, email: true, role: true,
                permissions: true, lastLoginAt: true,
                customRoleId: true,
                customRole: {
                    include: { permissions: true },
                },
            },
        });
        if (!admin) throw new UnauthorizedException('غير مصرح');
        return admin;
    }

    // يُستخدم مرة واحدة فقط لإنشاء أول مالك
    async createFirstOwner(data: { name: string; email: string; password: string }) {
        const existing = await this.prisma.superAdminUser.count();
        if (existing > 0) throw new ForbiddenException('المالك موجود مسبقاً');

        const hashed = await bcrypt.hash(data.password, 12);
        const owner = await this.prisma.superAdminUser.create({
            data: {
                ...data,
                password: hashed,
                role: 'OWNER',
                permissions: ['*'],
            },
        });

        return { success: true, message: 'تم إنشاء حساب المالك بنجاح', id: owner.id };
    }
}
