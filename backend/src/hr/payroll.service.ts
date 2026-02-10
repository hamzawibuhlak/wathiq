import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PayrollService {
    constructor(private prisma: PrismaService) { }

    async generateMonthlyPayroll(tenantId: string, month: number, year: number) {
        const employees = await this.prisma.employee.findMany({
            where: { tenantId, isActive: true, employmentStatus: { in: ['ACTIVE', 'PROBATION'] } },
        });

        const payrolls = [];
        for (const emp of employees) {
            try {
                const p = await this.generateEmployeePayroll(tenantId, emp.id, month, year);
                payrolls.push(p);
            } catch { /* skip if already exists */ }
        }

        return {
            month, year, totalEmployees: payrolls.length,
            totalGrossSalary: payrolls.reduce((s, p) => s + Number(p.grossSalary), 0),
            totalNetSalary: payrolls.reduce((s, p) => s + Number(p.netSalary), 0),
            totalDeductions: payrolls.reduce((s, p) => s + Number(p.totalDeductions), 0),
            payrolls,
        };
    }

    async generateEmployeePayroll(tenantId: string, employeeId: string, month: number, year: number) {
        const existing = await this.prisma.payroll.findUnique({
            where: { employeeId_payrollMonth_payrollYear: { employeeId, payrollMonth: month, payrollYear: year } },
        });
        if (existing) throw new BadRequestException('الراتب موجود بالفعل لهذا الشهر');

        const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
        if (!employee) throw new BadRequestException('الموظف غير موجود');

        const settings = await this.getSettings(tenantId);
        const payPeriodStart = new Date(year, month - 1, 1);
        const payPeriodEnd = new Date(year, month, 0);

        const basicSalary = Number(employee.basicSalary);
        const housingAllowance = Number(employee.housingAllowance);
        const transportAllowance = Number(employee.transportAllowance);

        // Overtime
        const { overtimeHours, overtimeAmount } = await this.calculateOvertime(employeeId, payPeriodStart, payPeriodEnd, basicSalary, settings);

        const grossSalary = basicSalary + housingAllowance + transportAllowance + overtimeAmount;

        // GOSI
        const gosiEmployee = this.calculateGOSI(basicSalary, Number(settings.gosiEmployeeRate), Number(settings.gosiMaxSalary));
        const gosiEmployer = this.calculateGOSI(basicSalary, Number(settings.gosiEmployerRate), Number(settings.gosiMaxSalary));

        // Deductions
        const absenceDeduction = await this.calculateAbsenceDeduction(employeeId, payPeriodStart, payPeriodEnd, basicSalary, settings);
        const lateDeduction = await this.calculateLateDeduction(employeeId, payPeriodStart, payPeriodEnd, basicSalary, settings);

        const totalDeductions = gosiEmployee + absenceDeduction + lateDeduction;
        const netSalary = grossSalary - totalDeductions;

        return this.prisma.payroll.create({
            data: {
                employeeId, payrollMonth: month, payrollYear: year, payPeriodStart, payPeriodEnd,
                basicSalary, housingAllowance, transportAllowance, overtimeHours, overtimeAmount,
                grossSalary, gosiEmployee, gosiEmployer, absenceDeduction, lateDeduction,
                totalDeductions, netSalary, status: 'PAYROLL_DRAFT', tenantId,
            },
            include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, jobTitle: true } } },
        });
    }

    async getPayrolls(tenantId: string, filters?: { month?: number; year?: number; status?: string; employeeId?: string }) {
        const where: any = { tenantId };
        if (filters?.month) where.payrollMonth = filters.month;
        if (filters?.year) where.payrollYear = filters.year;
        if (filters?.status) where.status = filters.status;
        if (filters?.employeeId) where.employeeId = filters.employeeId;

        return this.prisma.payroll.findMany({
            where,
            include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, jobTitle: true, department: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async approvePayroll(payrollId: string, userId: string, tenantId: string) {
        const payroll = await this.prisma.payroll.findUnique({ where: { id: payrollId } });
        if (!payroll || payroll.tenantId !== tenantId) throw new BadRequestException('الراتب غير موجود');
        if (payroll.status !== 'PAYROLL_DRAFT') throw new BadRequestException('الراتب تمت معالجته بالفعل');

        return this.prisma.payroll.update({
            where: { id: payrollId },
            data: { status: 'PAYROLL_APPROVED', processedAt: new Date(), processedBy: userId },
        });
    }

    async markAsPaid(payrollId: string, tenantId: string, data: { paymentMethod: string; paymentReference?: string }) {
        const payroll = await this.prisma.payroll.findUnique({ where: { id: payrollId } });
        if (!payroll || payroll.tenantId !== tenantId) throw new BadRequestException('الراتب غير موجود');

        return this.prisma.payroll.update({
            where: { id: payrollId },
            data: { status: 'PAYROLL_PAID', paidAt: new Date(), paymentMethod: data.paymentMethod, paymentReference: data.paymentReference },
        });
    }

    async getPayrollReport(tenantId: string, month: number, year: number) {
        const payrolls = await this.getPayrolls(tenantId, { month, year });
        const summary = {
            totalEmployees: payrolls.length,
            totalBasicSalary: 0, totalAllowances: 0, totalGrossSalary: 0,
            totalDeductions: 0, totalNetSalary: 0, totalGOSIEmployee: 0, totalGOSIEmployer: 0,
        };

        payrolls.forEach(p => {
            summary.totalBasicSalary += Number(p.basicSalary);
            summary.totalAllowances += Number(p.housingAllowance) + Number(p.transportAllowance);
            summary.totalGrossSalary += Number(p.grossSalary);
            summary.totalDeductions += Number(p.totalDeductions);
            summary.totalNetSalary += Number(p.netSalary);
            summary.totalGOSIEmployee += Number(p.gosiEmployee);
            summary.totalGOSIEmployer += Number(p.gosiEmployer);
        });

        return { payrolls, summary };
    }

    async generateBankFile(tenantId: string, month: number, year: number) {
        const payrolls = await this.prisma.payroll.findMany({
            where: { tenantId, payrollMonth: month, payrollYear: year, status: 'PAYROLL_APPROVED' },
            include: { employee: true },
        });

        let csv = 'رقم,رقم الموظف,الاسم,IBAN,المبلغ,العملة,البنك\n';
        payrolls.forEach((p, i) => {
            csv += `${i + 1},${p.employee.employeeNumber},${p.employee.firstName} ${p.employee.lastName},${p.employee.iban || ''},${Number(p.netSalary).toFixed(2)},SAR,${p.employee.bankName || ''}\n`;
        });

        return csv;
    }

    // --- Private helpers ---

    private calculateGOSI(basicSalary: number, rate: number, maxSalary: number): number {
        return Math.round(Math.min(basicSalary, maxSalary) * (rate / 100) * 100) / 100;
    }

    private async calculateOvertime(employeeId: string, start: Date, end: Date, basicSalary: number, settings: any) {
        if (!settings.overtimeEnabled) return { overtimeHours: 0, overtimeAmount: 0 };

        const whpd = Number(settings.workingHoursPerDay);
        const wdpm = Number(settings.workingDaysPerMonth);
        const records = await this.prisma.attendance.findMany({
            where: { employeeId, date: { gte: start, lte: end }, checkIn: { not: null }, checkOut: { not: null } },
        });

        let totalOT = 0;
        records.forEach(r => { const wh = Number(r.workHours); if (wh > whpd) totalOT += wh - whpd; });

        const hourlyRate = basicSalary / (whpd * wdpm);
        const otRate = Number(settings.overtimeRate);

        return {
            overtimeHours: Math.round(totalOT * 100) / 100,
            overtimeAmount: Math.round(totalOT * hourlyRate * otRate * 100) / 100,
        };
    }

    private async calculateAbsenceDeduction(employeeId: string, start: Date, end: Date, basicSalary: number, settings: any) {
        const absences = await this.prisma.attendance.count({
            where: { employeeId, date: { gte: start, lte: end }, status: 'ABSENT' },
        });
        if (absences === 0) return 0;
        const dailyRate = basicSalary / Number(settings.workingDaysPerMonth);
        return Math.round(absences * dailyRate * Number(settings.absenceDeductionRate) * 100) / 100;
    }

    private async calculateLateDeduction(employeeId: string, start: Date, end: Date, basicSalary: number, settings: any) {
        const lateRecords = await this.prisma.attendance.findMany({
            where: { employeeId, date: { gte: start, lte: end }, isLate: true },
        });
        if (lateRecords.length === 0) return 0;

        const totalLateMin = lateRecords.reduce((s, r) => {
            const m = r.lateMinutes - Number(settings.lateDeductionMinutes);
            return s + (m > 0 ? m : 0);
        }, 0);
        if (totalLateMin <= 0) return 0;

        const hourlyRate = basicSalary / (Number(settings.workingHoursPerDay) * Number(settings.workingDaysPerMonth));
        return Math.round((totalLateMin / 60) * hourlyRate * Number(settings.lateDeductionRate) * 100) / 100;
    }

    private async getSettings(tenantId: string) {
        let s = await this.prisma.payrollSettings.findUnique({ where: { tenantId } });
        if (!s) s = await this.prisma.payrollSettings.create({ data: { tenantId } });
        return s;
    }
}
