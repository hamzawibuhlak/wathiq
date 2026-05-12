import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class EmployeeService {
    constructor(
        private prisma: PrismaService,
        private encryptionService: EncryptionService,
    ) { }

    async create(dto: any) {
        const employeeNumber = await this.generateEmployeeNumber();
        const encryptedIdNumber = this.encryptionService.encrypt(dto.nationalIdNumber);

        // Probation: 90 days by Saudi Labor Law
        const probationEndDate = new Date(dto.hireDate);
        probationEndDate.setDate(probationEndDate.getDate() + 90);

        return this.prisma.employee.create({
            data: {
                employeeNumber,
                firstName: dto.firstName,
                lastName: dto.lastName,
                firstNameAr: dto.firstNameAr,
                lastNameAr: dto.lastNameAr,
                dateOfBirth: new Date(dto.dateOfBirth),
                gender: dto.gender,
                nationality: dto.nationality,
                nationalIdNumber: encryptedIdNumber,
                passportNumber: dto.passportNumber,
                maritalStatus: dto.maritalStatus,
                email: dto.email,
                phone: dto.phone,
                emergencyContact: dto.emergencyContact,
                currentAddress: dto.currentAddress,
                permanentAddress: dto.permanentAddress,
                jobTitle: dto.jobTitle,
                jobTitleAr: dto.jobTitleAr,
                departmentId: dto.departmentId,
                hireDate: new Date(dto.hireDate),
                probationEndDate,
                contractType: dto.contractType,
                employmentStatus: 'PROBATION',
                workLocation: dto.workLocation,
                directManagerId: dto.directManagerId,
                basicSalary: dto.basicSalary,
                housingAllowance: dto.housingAllowance || 0,
                transportAllowance: dto.transportAllowance || 0,
                otherAllowances: dto.otherAllowances,
                iqamaNumber: dto.iqamaNumber,
                iqamaExpiry: dto.iqamaExpiry ? new Date(dto.iqamaExpiry) : undefined,
                bankName: dto.bankName,
                accountNumber: dto.accountNumber,
                iban: dto.iban },
            include: {
                department: true,
                directManager: { select: { id: true, firstName: true, lastName: true, jobTitle: true } } } });
    }

    async findAll(filters?: { departmentId?: string; employmentStatus?: string; search?: string }) {
        const where: any = {};
        if (filters?.departmentId) where.departmentId = filters.departmentId;
        if (filters?.employmentStatus) where.employmentStatus = filters.employmentStatus;
        if (filters?.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search } },
                { employeeNumber: { contains: filters.search } },
            ];
        }

        return this.prisma.employee.findMany({
            where,
            include: {
                department: true,
                directManager: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' } });
    }

    async findOne(id: string) {
        const employee = await this.prisma.employee.findUnique({
            where: { id },
            include: {
                department: true,
                directManager: { select: { id: true, firstName: true, lastName: true, jobTitle: true, email: true } },
                subordinates: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
                documents: true,
                user: { select: { id: true, email: true, role: true } } } });

        if (!employee) {
            throw new NotFoundException('الموظف غير موجود');
        }

        // Decrypt national ID for display
        try {
            employee.nationalIdNumber = this.encryptionService.decrypt(employee.nationalIdNumber);
        } catch { /* keep as-is */ }

        return employee;
    }

    async update(id: string, data: any) {
        await this.findOne(id);
        if (data.nationalIdNumber) {
            data.nationalIdNumber = this.encryptionService.encrypt(data.nationalIdNumber);
        }
        if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
        if (data.hireDate) data.hireDate = new Date(data.hireDate);
        if (data.iqamaExpiry) data.iqamaExpiry = new Date(data.iqamaExpiry);

        return this.prisma.employee.update({
            where: { id },
            data,
            include: { department: true, directManager: true } });
    }

    async terminate(id: string, data: { terminationDate: string; terminationReason: string; lastWorkingDay: string }) {
        await this.findOne(id);
        return this.prisma.employee.update({
            where: { id },
            data: {
                employmentStatus: 'TERMINATED',
                terminationDate: new Date(data.terminationDate),
                terminationReason: data.terminationReason,
                lastWorkingDay: new Date(data.lastWorkingDay),
                isActive: false } });
    }

    /**
     * مكافأة نهاية الخدمة - Saudi Labor Law EOSB
     */
    async calculateEndOfServiceBenefits(employeeId: string) {
        const employee = await this.findOne(employeeId);
        const hireDate = new Date(employee.hireDate);
        const endDate = employee.terminationDate ? new Date(employee.terminationDate) : new Date();
        const yearsOfService = (endDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        const monthlySalary = Number(employee.basicSalary);

        let eosb = 0;
        if (yearsOfService < 2) {
            eosb = 0;
        } else if (yearsOfService <= 5) {
            eosb = (monthlySalary / 2) * yearsOfService;
        } else {
            eosb = (monthlySalary / 2) * 5 + monthlySalary * (yearsOfService - 5);
        }

        return {
            employeeName: `${employee.firstName} ${employee.lastName}`,
            yearsOfService: Math.round(yearsOfService * 10) / 10,
            monthlySalary,
            eosb: Math.round(eosb * 100) / 100 };
    }

    async getOrganizationChart() {
        const employees = await this.prisma.employee.findMany({
            where: { isActive: true },
            select: { id: true, firstName: true, lastName: true, jobTitle: true, photoUrl: true, departmentId: true, directManagerId: true } });
        return this.buildHierarchy(employees, null);
    }

    async getStatistics() {
        const [total, active, probation, onLeave, terminated] = await Promise.all([
            this.prisma.employee.count({ where: {} }),
            this.prisma.employee.count({ where: { employmentStatus: 'ACTIVE' } }),
            this.prisma.employee.count({ where: { employmentStatus: 'PROBATION' } }),
            this.prisma.employee.count({ where: { employmentStatus: 'ON_LEAVE' } }),
            this.prisma.employee.count({ where: { employmentStatus: 'TERMINATED' } }),
        ]);

        const byDepartment = await this.prisma.employee.groupBy({
            by: ['departmentId'],
            where: { isActive: true },
            _count: true });

        const departments = await this.prisma.department.findMany({
            where: {},
            select: { id: true, name: true } });

        const deptMap = new Map(departments.map(d => [d.id, d.name]));

        return {
            total, active, probation, onLeave, terminated,
            byDepartment: byDepartment.map(d => ({
                department: deptMap.get(d.departmentId) || 'غير محدد',
                count: d._count })) };
    }

    // --- Departments ---

    async createDepartment(data: any) {
        return this.prisma.department.create({
            data: { ...data } });
    }

    async getDepartments() {
        return this.prisma.department.findMany({
            where: {},
            include: { _count: { select: { employees: true } } },
            orderBy: { name: 'asc' } });
    }

    async updateDepartment(id: string, data: any) {
        return this.prisma.department.update({
            where: { id },
            data });
    }

    // Helpers

    private async generateEmployeeNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.prisma.employee.count({
            where: { employeeNumber: { startsWith: `EMP-${year}` } } });
        return `EMP-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    private buildHierarchy(employees: any[], managerId: string | null): any[] {
        return employees
            .filter(e => e.directManagerId === managerId)
            .map(emp => ({ ...emp, children: this.buildHierarchy(employees, emp.id) }));
    }
}
