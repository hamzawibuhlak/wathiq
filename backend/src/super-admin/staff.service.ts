import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
    constructor(private prisma: PrismaService) { }

    async getStaff() {
        return this.prisma.superAdminUser.findMany({
            select: {
                id: true, name: true, email: true, role: true,
                isActive: true, lastLoginAt: true, createdAt: true,
                permissions: true,
                customRoleId: true,
                customRole: {
                    select: { id: true, name: true, color: true, isSystem: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async addStaff(data: { name: string; email: string; password: string; role: string; customRoleId?: string }) {
        const hashed = await bcrypt.hash(data.password, 12);
        return this.prisma.superAdminUser.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashed,
                role: data.role as any,
                customRoleId: data.customRoleId || undefined,
                permissions: [],
            },
            select: {
                id: true, name: true, email: true, role: true, createdAt: true,
                customRoleId: true,
                customRole: {
                    select: { id: true, name: true, color: true },
                },
            },
        });
    }

    async updateStaffRole(staffId: string, role: string) {
        const staff = await this.prisma.superAdminUser.findUnique({ where: { id: staffId } });
        if (!staff) throw new NotFoundException('الموظف غير موجود');

        return this.prisma.superAdminUser.update({
            where: { id: staffId },
            data: {
                role: role as any,
            },
            select: { id: true, name: true, email: true, role: true, customRoleId: true },
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
