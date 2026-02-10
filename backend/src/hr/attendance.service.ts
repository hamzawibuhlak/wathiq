import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) { }

    async clockIn(employeeId: string, tenantId: string, data?: { location?: string; ipAddress?: string }) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await this.prisma.attendance.findUnique({
            where: { employeeId_date: { employeeId, date: today } },
        });

        if (existing?.checkIn) {
            throw new BadRequestException('تم تسجيل الحضور مسبقاً اليوم');
        }

        const now = new Date();
        const settings = await this.getSettings(tenantId);
        const [startHour, startMinute] = (settings?.workStartTime || '09:00').split(':').map(Number);
        const gracePeriod = settings?.gracePeriodMinutes || 15;

        const expectedStart = new Date(today);
        expectedStart.setHours(startHour, startMinute + gracePeriod, 0);

        const isLate = now > expectedStart;
        const lateMinutes = isLate ? Math.floor((now.getTime() - expectedStart.getTime()) / 60000) : 0;

        if (existing) {
            return this.prisma.attendance.update({
                where: { id: existing.id },
                data: { checkIn: now, status: isLate ? 'LATE' : 'PRESENT', isLate, lateMinutes, location: data?.location, ipAddress: data?.ipAddress },
                include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } } },
            });
        }

        return this.prisma.attendance.create({
            data: {
                employeeId, date: today, checkIn: now,
                status: isLate ? 'LATE' : 'PRESENT', isLate, lateMinutes,
                location: data?.location, ipAddress: data?.ipAddress, tenantId,
            },
            include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } } },
        });
    }

    async clockOut(employeeId: string, tenantId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await this.prisma.attendance.findUnique({
            where: { employeeId_date: { employeeId, date: today } },
        });

        if (!attendance || !attendance.checkIn) throw new BadRequestException('لم يتم تسجيل الحضور اليوم');
        if (attendance.checkOut) throw new BadRequestException('تم تسجيل الانصراف مسبقاً');

        const now = new Date();
        const workMinutes = Math.floor((now.getTime() - attendance.checkIn.getTime()) / 60000);
        const workHours = Math.round((workMinutes / 60) * 100) / 100;

        return this.prisma.attendance.update({
            where: { id: attendance.id },
            data: { checkOut: now, workHours },
            include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } } },
        });
    }

    async getAttendance(tenantId: string, filters?: { employeeId?: string; startDate?: string; endDate?: string; date?: string }) {
        const where: any = { tenantId };
        if (filters?.employeeId) where.employeeId = filters.employeeId;
        if (filters?.date) {
            const d = new Date(filters.date);
            d.setHours(0, 0, 0, 0);
            where.date = d;
        } else if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters?.startDate) where.date.gte = new Date(filters.startDate);
            if (filters?.endDate) where.date.lte = new Date(filters.endDate);
        }

        return this.prisma.attendance.findMany({
            where,
            include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, jobTitle: true } } },
            orderBy: { date: 'desc' },
        });
    }

    async getTodayStatus(employeeId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.prisma.attendance.findUnique({
            where: { employeeId_date: { employeeId, date: today } },
        });
    }

    async markAbsent(tenantId: string, date: string) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const employees = await this.prisma.employee.findMany({
            where: { tenantId, isActive: true }, select: { id: true },
        });

        const existing = await this.prisma.attendance.findMany({
            where: { tenantId, date: targetDate }, select: { employeeId: true },
        });

        const existingIds = new Set(existing.map(r => r.employeeId));
        const absent = employees.filter(e => !existingIds.has(e.id));

        if (absent.length > 0) {
            await this.prisma.attendance.createMany({
                data: absent.map(e => ({ employeeId: e.id, date: targetDate, status: 'ABSENT' as const, tenantId })),
            });
        }

        return { marked: absent.length };
    }

    async getAttendanceReport(tenantId: string, startDate: string, endDate: string) {
        const records = await this.getAttendance(tenantId, { startDate, endDate });
        const stats = new Map<string, any>();

        records.forEach(r => {
            if (!stats.has(r.employeeId)) {
                stats.set(r.employeeId, { employee: r.employee, present: 0, absent: 0, late: 0, totalLateMinutes: 0, totalWorkHours: 0 });
            }
            const s = stats.get(r.employeeId);
            if (r.status === 'PRESENT' || r.status === 'LATE') {
                s.present++;
                if (r.status === 'LATE') { s.late++; s.totalLateMinutes += r.lateMinutes; }
                if (r.workHours) s.totalWorkHours += Number(r.workHours);
            } else if (r.status === 'ABSENT') {
                s.absent++;
            }
        });

        return Array.from(stats.values());
    }

    async getSettings(tenantId: string) {
        return this.prisma.attendanceSettings.findUnique({ where: { tenantId } });
    }

    async updateSettings(tenantId: string, data: any) {
        return this.prisma.attendanceSettings.upsert({
            where: { tenantId },
            update: data,
            create: { ...data, tenantId },
        });
    }
}
