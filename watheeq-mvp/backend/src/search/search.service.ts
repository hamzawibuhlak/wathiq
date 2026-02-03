import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SearchService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Global search across all entities
     */
    async globalSearch(query: string, type: string, limit: number, tenantId: string) {
        if (!query || query.length < 2) {
            return { data: { cases: [], clients: [], hearings: [], documents: [], invoices: [], total: 0 } };
        }

        const results: {
            cases: any[];
            clients: any[];
            hearings: any[];
            documents: any[];
            invoices: any[];
        } = {
            cases: [],
            clients: [],
            hearings: [],
            documents: [],
            invoices: [],
        };

        // Search cases
        if (type === 'all' || type === 'cases') {
            results.cases = await this.prisma.case.findMany({
                where: {
                    tenantId,
                    OR: [
                        { caseNumber: { contains: query, mode: 'insensitive' } },
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { courtName: { contains: query, mode: 'insensitive' } },
                        { opposingParty: { contains: query, mode: 'insensitive' } },
                    ],
                },
                take: limit,
                select: {
                    id: true,
                    caseNumber: true,
                    title: true,
                    status: true,
                    caseType: true,
                    client: { select: { id: true, name: true } },
                },
                orderBy: { updatedAt: 'desc' },
            });
        }

        // Search clients
        if (type === 'all' || type === 'clients') {
            results.clients = await this.prisma.client.findMany({
                where: {
                    tenantId,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                        { phone: { contains: query, mode: 'insensitive' } },
                        { nationalId: { contains: query, mode: 'insensitive' } },
                        { companyName: { contains: query, mode: 'insensitive' } },
                    ],
                },
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    companyName: true,
                },
                orderBy: { updatedAt: 'desc' },
            });
        }

        // Search hearings
        if (type === 'all' || type === 'hearings') {
            results.hearings = await this.prisma.hearing.findMany({
                where: {
                    tenantId,
                    OR: [
                        { courtName: { contains: query, mode: 'insensitive' } },
                        { notes: { contains: query, mode: 'insensitive' } },
                        { case: { title: { contains: query, mode: 'insensitive' } } },
                        { case: { caseNumber: { contains: query, mode: 'insensitive' } } },
                    ],
                },
                take: limit,
                select: {
                    id: true,
                    hearingDate: true,
                    courtName: true,
                    status: true,
                    case: { select: { id: true, title: true, caseNumber: true } },
                },
                orderBy: { hearingDate: 'desc' },
            });
        }

        // Search documents
        if (type === 'all' || type === 'documents') {
            results.documents = await this.prisma.document.findMany({
                where: {
                    tenantId,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { fileName: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                    ],
                },
                take: limit,
                select: {
                    id: true,
                    title: true,
                    fileName: true,
                    documentType: true,
                    fileSize: true,
                    createdAt: true,
                    case: { select: { id: true, title: true, caseNumber: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        }

        // Search invoices
        if (type === 'all' || type === 'invoices') {
            results.invoices = await this.prisma.invoice.findMany({
                where: {
                    tenantId,
                    OR: [
                        { invoiceNumber: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { client: { name: { contains: query, mode: 'insensitive' } } },
                    ],
                },
                take: limit,
                select: {
                    id: true,
                    invoiceNumber: true,
                    totalAmount: true,
                    status: true,
                    dueDate: true,
                    client: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        }

        const total =
            results.cases.length +
            results.clients.length +
            results.hearings.length +
            results.documents.length +
            results.invoices.length;

        return { data: { ...results, total } };
    }

    /**
     * Get search suggestions for autocomplete
     */
    async getSearchSuggestions(query: string, tenantId: string) {
        if (!query || query.length < 2) {
            return { data: [] };
        }

        const [caseSuggestions, clientSuggestions] = await Promise.all([
            this.prisma.case.findMany({
                where: {
                    tenantId,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { caseNumber: { contains: query, mode: 'insensitive' } },
                    ],
                },
                take: 5,
                select: { title: true, caseNumber: true },
            }),
            this.prisma.client.findMany({
                where: {
                    tenantId,
                    name: { contains: query, mode: 'insensitive' },
                },
                take: 5,
                select: { name: true },
            }),
        ]);

        const suggestions = [
            ...caseSuggestions.map(c => ({ text: c.title, type: 'case', subtext: c.caseNumber })),
            ...clientSuggestions.map(c => ({ text: c.name, type: 'client' })),
        ];

        return { data: suggestions };
    }
}
