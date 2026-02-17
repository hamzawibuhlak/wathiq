import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class LegalLibraryService {
    constructor(private prisma: PrismaService) { }

    // ─── REGULATIONS ──────────────────────────────
    async getRegulations(filters?: {
        category?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 20 } = filters || {};

        const where: any = {};
        if (filters?.category) where.category = filters.category;
        if (filters?.status) where.status = filters.status;
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { contentText: { contains: filters.search, mode: 'insensitive' } },
                { tags: { has: filters.search } },
            ];
        }

        const [regulations, total] = await Promise.all([
            this.prisma.legalRegulation.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    titleEn: true,
                    number: true,
                    issuedBy: true,
                    issuedDate: true,
                    category: true,
                    status: true,
                    description: true,
                    tags: true,
                    viewCount: true,
                    _count: { select: { articles: true } },
                },
                orderBy: { viewCount: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.legalRegulation.count({ where }),
        ]);

        return { data: regulations, meta: { page, limit, total } };
    }

    async getRegulationById(id: string) {
        const regulation = await this.prisma.legalRegulation.findUnique({
            where: { id },
            include: {
                articles: {
                    orderBy: { number: 'asc' },
                },
            },
        });

        if (!regulation) throw new NotFoundException('النظام غير موجود');

        await this.prisma.legalRegulation.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });

        return regulation;
    }

    async createRegulation(data: {
        title: string;
        titleEn?: string;
        number?: string;
        issuedBy?: string;
        issuedDate?: string;
        effectiveDate?: string;
        category: string;
        status?: string;
        description?: string;
        content: string;
        source?: string;
        version?: string;
        tags?: string[];
        attachments?: string[];
        articles?: { number: string; title?: string; content: string; notes?: string }[];
    }) {
        const { articles, ...regData } = data;
        const regulation = await this.prisma.legalRegulation.create({
            data: {
                ...regData,
                category: regData.category as any,
                status: (regData.status as any) || 'ACTIVE_REG',
                issuedDate: regData.issuedDate ? new Date(regData.issuedDate) : undefined,
                effectiveDate: regData.effectiveDate ? new Date(regData.effectiveDate) : undefined,
                contentText: regData.content.replace(/<[^>]*>/g, ''),
                tags: regData.tags || [],
                articles: articles?.length
                    ? { create: articles }
                    : undefined,
            },
            include: { articles: true },
        });
        return regulation;
    }

    async deleteRegulation(id: string) {
        const reg = await this.prisma.legalRegulation.findUnique({ where: { id } });
        if (!reg) throw new NotFoundException('النظام غير موجود');
        await this.prisma.legalRegulation.delete({ where: { id } });
        return { message: 'تم حذف النظام بنجاح' };
    }

    async updateRegulation(id: string, data: any) {
        const reg = await this.prisma.legalRegulation.findUnique({ where: { id } });
        if (!reg) throw new NotFoundException('النظام غير موجود');
        const { articles, ...regData } = data;
        if (regData.issuedDate) regData.issuedDate = new Date(regData.issuedDate);
        if (regData.effectiveDate) regData.effectiveDate = new Date(regData.effectiveDate);
        if (regData.content) regData.contentText = regData.content.replace(/<[^>]*>/g, '');
        if (regData.category) regData.category = regData.category as any;
        if (regData.status) regData.status = regData.status as any;
        return this.prisma.legalRegulation.update({
            where: { id },
            data: regData,
            include: { articles: true },
        });
    }

    // ─── PRECEDENTS ───────────────────────────────
    async getPrecedents(filters?: {
        courtType?: string;
        caseType?: string;
        keyword?: string;
        yearFrom?: number;
        yearTo?: number;
        outcome?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 20 } = filters || {};

        const where: any = {};
        if (filters?.courtType) where.courtType = filters.courtType;
        if (filters?.caseType) where.caseType = filters.caseType;
        if (filters?.outcome) where.outcome = filters.outcome;
        if (filters?.yearFrom || filters?.yearTo) {
            where.judgmentDate = {};
            if (filters.yearFrom) where.judgmentDate.gte = new Date(`${filters.yearFrom}-01-01`);
            if (filters.yearTo) where.judgmentDate.lte = new Date(`${filters.yearTo}-12-31`);
        }
        if (filters?.search) {
            where.OR = [
                { summary: { contains: filters.search, mode: 'insensitive' } },
                { legalPrinciple: { contains: filters.search, mode: 'insensitive' } },
                { keywords: { has: filters.search } },
                { caseNumber: { contains: filters.search } },
            ];
        }

        const [precedents, total] = await Promise.all([
            this.prisma.legalPrecedent.findMany({
                where,
                select: {
                    id: true,
                    caseNumber: true,
                    court: true,
                    courtType: true,
                    judgmentDate: true,
                    summary: true,
                    legalPrinciple: true,
                    caseType: true,
                    outcome: true,
                    keywords: true,
                    viewCount: true,
                    isVerified: true,
                },
                orderBy: { viewCount: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.legalPrecedent.count({ where }),
        ]);

        return { data: precedents, meta: { page, limit, total } };
    }

    async getPrecedentById(id: string) {
        const precedent = await this.prisma.legalPrecedent.findUnique({
            where: { id },
        });

        if (!precedent) throw new NotFoundException('الحكم غير موجود');

        await this.prisma.legalPrecedent.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });

        return precedent;
    }

    async createPrecedent(data: {
        caseNumber?: string;
        court: string;
        courtType: string;
        circuit?: string;
        judgmentDate?: string;
        summary: string;
        fullText?: string;
        legalPrinciple: string;
        caseType: string;
        outcome: string;
        keywords?: string[];
    }) {
        return this.prisma.legalPrecedent.create({
            data: {
                ...data,
                courtType: data.courtType as any,
                outcome: data.outcome as any,
                judgmentDate: data.judgmentDate ? new Date(data.judgmentDate) : undefined,
                keywords: data.keywords || [],
            },
        });
    }

    async updatePrecedent(id: string, data: any) {
        const p = await this.prisma.legalPrecedent.findUnique({ where: { id } });
        if (!p) throw new NotFoundException('الحكم غير موجود');
        if (data.courtType) data.courtType = data.courtType as any;
        if (data.outcome) data.outcome = data.outcome as any;
        if (data.judgmentDate) data.judgmentDate = new Date(data.judgmentDate);
        return this.prisma.legalPrecedent.update({ where: { id }, data });
    }

    async deletePrecedent(id: string) {
        const p = await this.prisma.legalPrecedent.findUnique({ where: { id } });
        if (!p) throw new NotFoundException('الحكم غير موجود');
        await this.prisma.legalPrecedent.delete({ where: { id } });
        return { message: 'تم حذف الحكم بنجاح' };
    }

    // ─── GLOSSARY ─────────────────────────────────
    async getTerms(filters?: {
        search?: string;
        category?: string;
        letter?: string;
    }) {
        const where: any = {};
        if (filters?.category) where.category = filters.category;
        if (filters?.letter) {
            where.termAr = { startsWith: filters.letter };
        }
        if (filters?.search) {
            where.OR = [
                { termAr: { contains: filters.search, mode: 'insensitive' } },
                { termEn: { contains: filters.search, mode: 'insensitive' } },
                { definition: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.legalTerm.findMany({
            where,
            orderBy: { termAr: 'asc' },
        });
    }

    async getTermById(id: string) {
        const term = await this.prisma.legalTerm.findUnique({ where: { id } });
        if (!term) throw new NotFoundException('المصطلح غير موجود');

        await this.prisma.legalTerm.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });

        if (term.relatedTerms?.length) {
            const related = await this.prisma.legalTerm.findMany({
                where: { termAr: { in: term.relatedTerms } },
                select: { id: true, termAr: true, termEn: true },
            });
            return { ...term, relatedTermsData: related };
        }

        return term;
    }

    async createTerm(data: {
        termAr: string;
        termEn?: string;
        definition: string;
        example?: string;
        category?: string;
        relatedTerms?: string[];
        source?: string;
    }) {
        return this.prisma.legalTerm.create({
            data: {
                ...data,
                relatedTerms: data.relatedTerms || [],
            },
        });
    }

    async updateTerm(id: string, data: any) {
        const t = await this.prisma.legalTerm.findUnique({ where: { id } });
        if (!t) throw new NotFoundException('المصطلح غير موجود');
        return this.prisma.legalTerm.update({ where: { id }, data });
    }

    async deleteTerm(id: string) {
        const t = await this.prisma.legalTerm.findUnique({ where: { id } });
        if (!t) throw new NotFoundException('المصطلح غير موجود');
        await this.prisma.legalTerm.delete({ where: { id } });
        return { message: 'تم حذف المصطلح بنجاح' };
    }

    // ─── GLOBAL SEARCH ────────────────────────────
    async globalSearch(query: string) {
        const [regulations, precedents, terms] = await Promise.all([
            this.prisma.legalRegulation.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { contentText: { contains: query, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, title: true, category: true, status: true },
                take: 5,
            }),
            this.prisma.legalPrecedent.findMany({
                where: {
                    OR: [
                        { summary: { contains: query, mode: 'insensitive' } },
                        { legalPrinciple: { contains: query, mode: 'insensitive' } },
                        { keywords: { has: query } },
                    ],
                },
                select: { id: true, court: true, caseType: true, summary: true, judgmentDate: true },
                take: 5,
            }),
            this.prisma.legalTerm.findMany({
                where: {
                    OR: [
                        { termAr: { contains: query, mode: 'insensitive' } },
                        { termEn: { contains: query, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, termAr: true, termEn: true, definition: true },
                take: 5,
            }),
        ]);

        return { regulations, precedents, terms };
    }

    // ─── AI SMART SEARCH ──────────────────────────
    // NOTE: AI search is now handled by LegalAIService.askAI()
    // This method is kept for backward compatibility
    async aiSearch(query: string, tenantId: string, userId: string) {
        // 1. Regular search first
        const searchResults = await this.globalSearch(query);

        // 2. Build context from results
        const context = this.buildSearchContext(searchResults);

        // 3. Return results with context
        const aiAnswer = `بناءً على البحث في المكتبة القانونية عن "${query}":\n\n${context}\n\nللحصول على إجابة أكثر تفصيلاً بالذكاء الاصطناعي، استخدم ميزة "البحث القانوني الذكي".`;

        // 4. Log search
        await this.prisma.legalSearchLog.create({
            data: {
                query,
                results: { aiAnswer, sources: searchResults } as any,
                tenantId,
                createdBy: userId,
                queryType: 'KEYWORD',
            },
        });

        return { aiAnswer, sources: searchResults };
    }

    // ─── BOOKMARKS ────────────────────────────────
    async getBookmarks(tenantId: string, userId: string, folderId?: string) {
        return this.prisma.legalBookmark.findMany({
            where: {
                tenantId,
                createdBy: userId,
                ...(folderId ? { folderId } : {}),
            },
            include: {
                regulation: { select: { id: true, title: true, category: true } },
                article: {
                    include: { regulation: { select: { id: true, title: true } } },
                },
                precedent: { select: { id: true, court: true, caseType: true, summary: true } },
                folder: { select: { id: true, name: true, color: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addBookmark(
        tenantId: string,
        userId: string,
        data: {
            type: string;
            regulationId?: string;
            articleId?: string;
            precedentId?: string;
            termId?: string;
            notes?: string;
            folderId?: string;
        },
    ) {
        return this.prisma.legalBookmark.create({
            data: {
                type: data.type as any,
                regulationId: data.regulationId,
                articleId: data.articleId,
                precedentId: data.precedentId,
                termId: data.termId,
                notes: data.notes,
                folderId: data.folderId,
                tenantId,
                createdBy: userId,
            },
        });
    }

    async removeBookmark(id: string, tenantId: string, userId: string) {
        const bookmark = await this.prisma.legalBookmark.findUnique({ where: { id } });
        if (!bookmark || bookmark.tenantId !== tenantId || bookmark.createdBy !== userId) {
            throw new NotFoundException('المفضلة غير موجودة');
        }
        return this.prisma.legalBookmark.delete({ where: { id } });
    }

    // ─── BOOKMARK FOLDERS ─────────────────────────
    async getFolders(tenantId: string, userId: string) {
        return this.prisma.bookmarkFolder.findMany({
            where: { tenantId, createdBy: userId },
            include: { _count: { select: { bookmarks: true } } },
        });
    }

    async createFolder(tenantId: string, userId: string, data: { name: string; color?: string }) {
        return this.prisma.bookmarkFolder.create({
            data: { ...data, tenantId, createdBy: userId },
        });
    }

    // ─── LINK TO CASE ─────────────────────────────
    async linkToCase(
        caseId: string,
        tenantId: string,
        userId: string,
        data: {
            type: string;
            regulationId?: string;
            articleId?: string;
            precedentId?: string;
            termId?: string;
            notes?: string;
        },
    ) {
        return this.prisma.caseLegalReference.create({
            data: {
                caseId,
                type: data.type as any,
                regulationId: data.regulationId,
                articleId: data.articleId,
                precedentId: data.precedentId,
                termId: data.termId,
                notes: data.notes,
                addedBy: userId,
                tenantId,
            },
        });
    }

    async getCaseReferences(caseId: string, tenantId: string) {
        return this.prisma.caseLegalReference.findMany({
            where: { caseId, tenantId },
            include: {
                user: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ─── STATS ────────────────────────────────────
    async getStats() {
        const [regulations, precedents, terms] = await Promise.all([
            this.prisma.legalRegulation.count(),
            this.prisma.legalPrecedent.count(),
            this.prisma.legalTerm.count(),
        ]);

        const popular = await this.prisma.legalRegulation.findMany({
            orderBy: { viewCount: 'desc' },
            take: 5,
            select: { id: true, title: true, category: true, viewCount: true },
        });

        return { regulations, precedents, terms, popular };
    }

    // ─── HELPERS ──────────────────────────────────
    private buildSearchContext(results: any): string {
        let context = '';

        if (results.regulations?.length) {
            context += 'الأنظمة ذات الصلة:\n';
            results.regulations.forEach((r: any) => {
                context += `- ${r.title} (${r.category})\n`;
            });
        }

        if (results.precedents?.length) {
            context += '\nالأحكام القضائية ذات الصلة:\n';
            results.precedents.forEach((p: any) => {
                context += `- ${p.court}: ${p.summary?.substring(0, 100)}...\n`;
            });
        }

        if (results.terms?.length) {
            context += '\nمصطلحات ذات صلة:\n';
            results.terms.forEach((t: any) => {
                context += `- ${t.termAr}: ${t.definition?.substring(0, 80)}...\n`;
            });
        }

        return context || 'لم يتم العثور على مصادر مطابقة.';
    }
}
