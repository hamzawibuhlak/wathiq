import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntityCodeService {
    constructor(private readonly prisma: PrismaService) { }

    // ═══════════════════════════════════════════════════════════
    // 🏢 TENANT CODE
    // ═══════════════════════════════════════════════════════════

    generateTenantCode(slug: string): { code: string; codePrefix: string } {
        return { code: `${slug}_law`, codePrefix: slug };
    }

    // ═══════════════════════════════════════════════════════════
    // 👤 USER CODE
    // ═══════════════════════════════════════════════════════════

    async generateUserCode(tenantId: string, isOwner = false): Promise<{ code: string; codeNumber: number }> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { codePrefix: true, slug: true },
        });
        if (!tenant) throw new Error('Tenant not found');
        const prefix = tenant.codePrefix || tenant.slug;

        if (isOwner) {
            return { code: `${prefix}_US0001`, codeNumber: 1 };
        }

        const last = await this.prisma.user.findFirst({
            where: { tenantId, codeNumber: { not: null } },
            orderBy: { codeNumber: 'desc' },
            select: { codeNumber: true },
        });
        const next = (last?.codeNumber || 0) + 1;
        if (next > 9999) throw new ConflictException('تم الوصول للحد الأقصى من المستخدمين (9999)');

        return { code: `${prefix}_US${next.toString().padStart(4, '0')}`, codeNumber: next };
    }

    // ═══════════════════════════════════════════════════════════
    // 👨‍💼 CLIENT CODE
    // ═══════════════════════════════════════════════════════════

    async generateClientCode(tenantId: string): Promise<{ code: string; codeNumber: number }> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { codePrefix: true, slug: true },
        });
        if (!tenant) throw new Error('Tenant not found');
        const prefix = tenant.codePrefix || tenant.slug;

        const last = await this.prisma.client.findFirst({
            where: { tenantId, codeNumber: { not: null } },
            orderBy: { codeNumber: 'desc' },
            select: { codeNumber: true },
        });
        const next = (last?.codeNumber || 0) + 1;
        if (next > 9999) throw new ConflictException('تم الوصول للحد الأقصى من العملاء (9999)');

        return { code: `${prefix}_CL${next.toString().padStart(4, '0')}`, codeNumber: next };
    }

    // ═══════════════════════════════════════════════════════════
    // ⚖️ CASE CODE (hierarchical from client)
    // ═══════════════════════════════════════════════════════════

    async generateCaseCode(clientId: string): Promise<{ code: string; codeNumber: number }> {
        const client = await this.prisma.client.findUnique({
            where: { id: clientId },
            select: { code: true, tenantId: true, tenant: { select: { codePrefix: true, slug: true } } },
        });
        if (!client) throw new Error('Client not found');

        // Fallback if client doesn't have code yet
        const clientCode = client.code || `${client.tenant.codePrefix || client.tenant.slug}_CL0000`;

        const last = await this.prisma.case.findFirst({
            where: { clientId, codeNumber: { not: null } },
            orderBy: { codeNumber: 'desc' },
            select: { codeNumber: true },
        });
        const next = (last?.codeNumber || 0) + 1;
        if (next > 99999) throw new ConflictException('تم الوصول للحد الأقصى من القضايا للعميل (99999)');

        return { code: `${clientCode}_CA${next.toString().padStart(5, '0')}`, codeNumber: next };
    }

    // ═══════════════════════════════════════════════════════════
    // 🏛️ HEARING CODE (hierarchical from case)
    // ═══════════════════════════════════════════════════════════

    async generateHearingCode(caseId: string): Promise<{ code: string; codeNumber: number }> {
        const caseData = await this.prisma.case.findUnique({
            where: { id: caseId },
            select: { code: true, tenantId: true, tenant: { select: { codePrefix: true, slug: true } } },
        });
        if (!caseData) throw new Error('Case not found');

        const caseCode = caseData.code || `${caseData.tenant.codePrefix || caseData.tenant.slug}_CA00000`;

        const last = await this.prisma.hearing.findFirst({
            where: { caseId, codeNumber: { not: null } },
            orderBy: { codeNumber: 'desc' },
            select: { codeNumber: true },
        });
        const next = (last?.codeNumber || 0) + 1;
        if (next > 99999) throw new ConflictException('تم الوصول للحد الأقصى من الجلسات للقضية (99999)');

        return { code: `${caseCode}_CS${next.toString().padStart(5, '0')}`, codeNumber: next };
    }

    // ═══════════════════════════════════════════════════════════
    // 📄 FLAT ENTITY CODE (Document, Invoice, Task, Expense)
    // ═══════════════════════════════════════════════════════════

    async generateFlatCode(
        tenantId: string,
        entityType: 'document' | 'invoice' | 'task' | 'expense' | 'case' | 'hearing',
    ): Promise<{ code: string; codeNumber: number }> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { codePrefix: true, slug: true },
        });
        if (!tenant) throw new Error('Tenant not found');
        const prefix = tenant.codePrefix || tenant.slug;

        const config: Record<string, { prefix: string; digits: number }> = {
            document: { prefix: 'DOC', digits: 5 },
            invoice: { prefix: 'INV', digits: 5 },
            task: { prefix: 'TK', digits: 5 },
            expense: { prefix: 'EX', digits: 5 },
            case: { prefix: 'CA', digits: 5 },
            hearing: { prefix: 'CS', digits: 5 },
        };

        const { prefix: typePrefix, digits } = config[entityType];

        // Query max codeNumber for this tenant in the specific model
        let last: { codeNumber: number | null } | null = null;
        switch (entityType) {
            case 'document':
                last = await this.prisma.document.findFirst({
                    where: { tenantId, codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true },
                });
                break;
            case 'invoice':
                last = await this.prisma.invoice.findFirst({
                    where: { tenantId, codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true },
                });
                break;
            case 'task':
                last = await this.prisma.task.findFirst({
                    where: { tenantId, codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true },
                });
                break;
            case 'expense':
                last = await this.prisma.expense.findFirst({
                    where: { tenantId, codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true },
                });
                break;
            case 'case':
                last = await this.prisma.case.findFirst({
                    where: { tenantId, codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true },
                });
                break;
            case 'hearing':
                last = await this.prisma.hearing.findFirst({
                    where: { tenantId, codeNumber: { not: null } },
                    orderBy: { codeNumber: 'desc' },
                    select: { codeNumber: true },
                });
                break;
        }

        const next = (last?.codeNumber || 0) + 1;
        const maxNumber = Math.pow(10, digits) - 1;
        if (next > maxNumber) {
            throw new ConflictException(`تم الوصول للحد الأقصى (${maxNumber})`);
        }

        return {
            code: `${prefix}_${typePrefix}${next.toString().padStart(digits, '0')}`,
            codeNumber: next,
        };
    }
}
