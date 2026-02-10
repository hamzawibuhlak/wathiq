import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class LeaveService {
    constructor(private prisma: PrismaService) { }

    async submitRequest(employeeId: string, tenantId: string, data: { leaveTypeId: string; startDate: string; endDate: string; reason: string; attachmentUrl?: string }) {
        const totalDays = this.calculateBusinessDays(new Date(data.startDate), new Date(data.endDate));
        if (totalDays <= 0) throw new BadRequestException('تواريخ غير صحيحة');

        const leaveType = await this.prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } });
        if (!leaveType) throw new BadRequestException('نوع الإجازة غير موجود');
        if (leaveType.maxConsecutiveDays && totalDays > leaveType.maxConsecutiveDays) {
            throw new BadRequestException(`الحد الأقصى للأيام المتتالية هو ${leaveType.maxConsecutiveDays} يوم`);
        }

        const year = new Date().getFullYear();
        const balance = await this.getOrCreateBalance(employeeId, data.leaveTypeId, year, tenantId);
        if (balance.remaining < totalDays) {
            throw new BadRequestException(`رصيد الإجازة غير كافي. المتبقي: ${balance.remaining} يوم`);
        }

        const overlapping = await this.prisma.leaveRequest.findFirst({
            where: {
                employeeId, status: { in: ['LEAVE_PENDING', 'LEAVE_APPROVED'] },
                OR: [{ startDate: { lte: new Date(data.endDate) }, endDate: { gte: new Date(data.startDate) } }],
            },
        });
        if (overlapping) throw new BadRequestException('يوجد طلب إجازة متداخل');

        return this.prisma.leaveRequest.create({
            data: {
                employeeId, leaveTypeId: data.leaveTypeId,
                startDate: new Date(data.startDate), endDate: new Date(data.endDate),
                totalDays, reason: data.reason, attachmentUrl: data.attachmentUrl,
                status: leaveType.requiresApproval ? 'LEAVE_PENDING' : 'LEAVE_APPROVED',
                tenantId,
            },
            include: { leaveType: true, employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } } },
        });
    }

    async reviewRequest(requestId: string, tenantId: string, reviewerId: string, data: { status: 'LEAVE_APPROVED' | 'LEAVE_REJECTED'; reviewNotes?: string }) {
        const request = await this.prisma.leaveRequest.findUnique({ where: { id: requestId }, include: { leaveType: true } });
        if (!request || request.tenantId !== tenantId) throw new BadRequestException('الطلب غير موجود');
        if (request.status !== 'LEAVE_PENDING') throw new BadRequestException('الطلب تمت مراجعته بالفعل');

        const updated = await this.prisma.leaveRequest.update({
            where: { id: requestId },
            data: { status: data.status, reviewedBy: reviewerId, reviewedAt: new Date(), reviewNotes: data.reviewNotes },
            include: { employee: true, leaveType: true },
        });

        if (data.status === 'LEAVE_APPROVED') {
            const year = new Date().getFullYear();
            const balance = await this.getOrCreateBalance(request.employeeId, request.leaveTypeId, year, tenantId);
            await this.prisma.leaveBalance.update({
                where: { id: balance.id },
                data: { used: balance.used + request.totalDays, remaining: balance.remaining - request.totalDays },
            });
        }

        return updated;
    }

    async getLeaveRequests(tenantId: string, filters?: { employeeId?: string; status?: string }) {
        const where: any = { tenantId };
        if (filters?.employeeId) where.employeeId = filters.employeeId;
        if (filters?.status) where.status = filters.status;

        return this.prisma.leaveRequest.findMany({
            where,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, jobTitle: true, department: true } },
                leaveType: true,
                reviewer: { select: { id: true, name: true } },
            },
            orderBy: { requestedAt: 'desc' },
        });
    }

    async getEmployeeBalances(employeeId: string, tenantId: string) {
        const year = new Date().getFullYear();
        const leaveTypes = await this.prisma.leaveType.findMany({ where: { tenantId, isActive: true } });
        const balances = await Promise.all(
            leaveTypes.map(lt => this.getOrCreateBalance(employeeId, lt.id, year, tenantId)),
        );
        return balances;
    }

    // --- Leave Types ---
    async getLeaveTypes(tenantId: string) {
        return this.prisma.leaveType.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
    }

    async createLeaveType(tenantId: string, data: any) {
        return this.prisma.leaveType.create({ data: { ...data, tenantId } });
    }

    async initializeDefaultLeaveTypes(tenantId: string) {
        const defaults = [
            { name: 'إجازة سنوية', nameAr: 'إجازة سنوية', code: 'ANNUAL', daysPerYear: 21, isPaid: true },
            { name: 'إجازة مرضية', nameAr: 'إجازة مرضية', code: 'SICK', daysPerYear: 30, isPaid: true },
            { name: 'إجازة بدون راتب', nameAr: 'إجازة بدون راتب', code: 'UNPAID', daysPerYear: 365, isPaid: false },
            { name: 'إجازة طارئة', nameAr: 'إجازة طارئة', code: 'EMERGENCY', daysPerYear: 5, isPaid: true, maxConsecutiveDays: 2 },
            { name: 'إجازة أمومة', nameAr: 'إجازة أمومة', code: 'MATERNITY', daysPerYear: 70, isPaid: true },
            { name: 'إجازة أبوة', nameAr: 'إجازة أبوة', code: 'PATERNITY', daysPerYear: 3, isPaid: true },
        ];

        for (const lt of defaults) {
            await this.prisma.leaveType.upsert({
                where: { tenantId_code: { tenantId, code: lt.code } },
                update: {},
                create: { ...lt, tenantId },
            });
        }

        return this.getLeaveTypes(tenantId);
    }

    // Helpers
    private async getOrCreateBalance(employeeId: string, leaveTypeId: string, year: number, tenantId: string) {
        let balance = await this.prisma.leaveBalance.findUnique({
            where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
            include: { leaveType: true },
        });

        if (!balance) {
            const leaveType = await this.prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
            if (!leaveType) throw new BadRequestException('نوع الإجازة غير موجود');
            balance = await this.prisma.leaveBalance.create({
                data: { employeeId, leaveTypeId, year, allocated: leaveType.daysPerYear, used: 0, remaining: leaveType.daysPerYear, tenantId },
                include: { leaveType: true },
            });
        }

        return balance;
    }

    private calculateBusinessDays(start: Date, end: Date): number {
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            const day = current.getDay();
            if (day !== 5 && day !== 6) count++; // Fri=5, Sat=6 are weekend in Saudi
            current.setDate(current.getDate() + 1);
        }
        return count;
    }
}
