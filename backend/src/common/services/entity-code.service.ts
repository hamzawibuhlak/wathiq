import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntityCodeService {
    constructor(private readonly prisma: PrismaService) { }

    private readonly PREFIX = process.env.OFFICE_CODE_PREFIX || 'OFFICE';

    async generateUserCode(isOwner = false): Promise<{ code: string; codeNumber: number }> {
        const prefix = this.PREFIX;

        if (isOwner) {
            return { code: `${prefix}_US0001`, codeNumber: 1 };
        }

        const last = await this.prisma.user.findFirst({
            where: { codeNumber: { not: null } },
            orderBy: { codeNumber: 'desc' },
            select: { codeNumber: true } });
        const next = (last?.codeNumber || 0) + 1;
        if (next > 9999) throw new ConflictException('تم الوصول للحد الأقصى من المستخدمين (9999)');

        return { code: `${prefix}_US${next.toString().padStart(4, '0')}`, codeNumber: next };
    }

    async generateClientCode(): Promise<{ code: string; codeNumber: number }> {
        const prefix = this.PREFIX;

        const last = await this.prisma.client.findFirst({
            where: { codeNumber: { not: null } },
            orderBy: { codeNumber: 'desc' },
            select: { codeNumber: true } });
        const next = (last?.codeNumber || 0) + 1;
        if (next > 9999) throw new ConflictException('تم الوصول للحد الأقصى من العملاء (9999)');

        return { code: `${prefix}_CL${next.toString().padStart(4, '0')}`, codeNumber: next };
    }

    async generateCaseCode(clientId: string): Promise<{ code: string; codeNumber: number }> {
        const client = await this.prisma.client.findUnique({
            where: { id: clientId },
            select: { code: true } });
        if (!client) throw new Error('Client not found');

        const clientCode = client.code || `${this.PREFIX}_CL0000`;

        const last = await this.prisma.case.findFirst({
            where: { clientId, codeNumber: { not: null } },
            orderBy: { codeNumber: 'desc' },
            select: { codeNumber: true } });
        const next = (last?.codeNumber || 0) + 1;
        if (next > 99999) throw new ConflictException('تم الوصول للحد الأقصى من القضايا للعميل (99999)');

        return { code: `${clientCode}_CA${next.toString().padStart(5, '0')}`, codeNumber: next };
    }

    async generateHearingCode(caseId: string): Promise<{ code: string; codeNumber: number }> {
        const caseData = await this.prisma.case.findUnique({
            where: { id: caseId },
            select: { code: true } });
        if (!caseData) throw new Error('Case not found');

        const caseCode = caseData.code || `${this.PREFIX}_CA00000`;

        const last = await this.prisma.hearing.findFirst({
            where: { caseId, codeNumber: { not: null } },
            orderBy: { codeNumber: 'desc' },
            select: { codeNumber: true } });
        const next = (last?.codeNumber || 0) + 1;
        if (next > 99999) throw new ConflictException('تم الوصول للحد الأقصى من الجلسات للقضية (99999)');

        return { code: `${caseCode}_CS${next.toString().padStart(5, '0')}`, codeNumber: next };
    }

    async generateFlatCode(entityType: 'document' | 'invoice' | 'task' | 'expense' | 'case' | 'hearing' | 'form',
    ): Promise<{ code: string; codeNumber: number }> {
        const prefix = this.PREFIX;

        const config: Record<string, { prefix: string; digits: number }> = {
            document: { prefix: 'DOC', digits: 5 },
            invoice: { prefix: 'INV', digits: 5 },
            task: { prefix: 'TK', digits: 5 },
            expense: { prefix: 'EX', digits: 5 },
            case: { prefix: 'CA', digits: 5 },
            hearing: { prefix: 'CS', digits: 5 },
            form: { prefix: 'FM', digits: 5 } };

        const { prefix: typePrefix, digits } = config[entityType];

        let last: { codeNumber: number | null } | null = null;
        switch (entityType) {
            case 'document':
                last = await this.prisma.document.findFirst({
                    where: { codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true } });
                break;
            case 'invoice':
                last = await this.prisma.invoice.findFirst({
                    where: { codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true } });
                break;
            case 'task':
                last = await this.prisma.task.findFirst({
                    where: { codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true } });
                break;
            case 'expense':
                last = await this.prisma.expense.findFirst({
                    where: { codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true } });
                break;
            case 'case':
                last = await this.prisma.case.findFirst({
                    where: { codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true } });
                break;
            case 'hearing':
                last = await this.prisma.hearing.findFirst({
                    where: { codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true } });
                break;
            case 'form':
                last = await this.prisma.form.findFirst({
                    where: {},
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true } });
                break;
        }

        const next = (last?.codeNumber || 0) + 1;
        const maxNumber = Math.pow(10, digits) - 1;
        if (next > maxNumber) {
            throw new ConflictException(`تم الوصول للحد الأقصى (${maxNumber})`);
        }

        return {
            code: `${prefix}_${typePrefix}${next.toString().padStart(digits, '0')}`,
            codeNumber: next };
    }
}
