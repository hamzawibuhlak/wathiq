import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const ROLE_PERMISSIONS: Record<string, string[]> = {
    OWNER: ['*'],
    MANAGER: ['view_tenants', 'freeze_tenant', 'change_plan', 'chat', 'manage_staff', 'view_revenue'],
    SUPPORT: ['view_tenants', 'chat', 'add_notes'],
    SALES: ['view_tenants', 'chat', 'change_plan', 'view_revenue'],
    MODERATOR: ['view_tenants', 'freeze_tenant', 'chat'],
};

@Injectable()
export class StaffService {
    constructor(private prisma: PrismaService) { }

    async getStaff() {
        return this.prisma.superAdminUser.findMany({
            select: {
                id: true, name: true, email: true, role: true,
                isActive: true, lastLoginAt: true, createdAt: true,
                permissions: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async addStaff(data: { name: string; email: string; password: string; role: string }) {
        const hashed = await bcrypt.hash(data.password, 12);
        return this.prisma.superAdminUser.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashed,
                role: data.role as any,
                permissions: ROLE_PERMISSIONS[data.role] || [],
            },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });
    }

    async updateStaffRole(staffId: string, role: string) {
        const staff = await this.prisma.superAdminUser.findUnique({ where: { id: staffId } });
        if (!staff) throw new NotFoundException('الموظف غير موجود');

        return this.prisma.superAdminUser.update({
            where: { id: staffId },
            data: {
                role: role as any,
                permissions: ROLE_PERMISSIONS[role] || [],
            },
            select: { id: true, name: true, email: true, role: true, permissions: true },
        });
    }

    async deactivateStaff(staffId: string) {
        return this.prisma.superAdminUser.update({
            where: { id: staffId },
            data: { isActive: false },
            select: { id: true, name: true, isActive: true },
        });
    }

    async activateStaff(staffId: string) {
        return this.prisma.superAdminUser.update({
            where: { id: staffId },
            data: { isActive: true },
            select: { id: true, name: true, isActive: true },
        });
    }

    async resetPassword(staffId: string, newPassword: string) {
        const hashed = await bcrypt.hash(newPassword, 12);
        await this.prisma.superAdminUser.update({
            where: { id: staffId },
            data: { password: hashed },
        });
        return { success: true };
    }
}
