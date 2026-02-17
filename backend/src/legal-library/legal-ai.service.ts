import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import * as crypto from 'crypto';

/**
 * Legal AI Service — خدمة الذكاء الاصطناعي القانوني
 * 
 * Provides AI-powered legal question answering using OpenAI or Anthropic.
 * Set AI_PROVIDER=openai or AI_PROVIDER=anthropic in .env
 * If not set, auto-detects based on which API key is available.
 * Gracefully degrades to keyword search if no API key is configured.
 */
@Injectable()
export class LegalAIService {
    private readonly logger = new Logger(LegalAIService.name);
    private anthropicClient: any = null;
    private openaiClient: any = null;
    private aiProvider: 'openai' | 'anthropic' | null = null;
    private isAIEnabled = false;

    constructor(
        private prisma: PrismaService,
        private cacheService: CacheService,
    ) {
        this.initializeAI();
    }

    // ══════════════════════════════════════════════════════════
    // 🔧 INITIALIZATION
    // ══════════════════════════════════════════════════════════

    private async initializeAI() {
        // 1. Read from env first
        let preferredProvider = process.env.AI_PROVIDER?.toLowerCase();
        let openaiKey = process.env.OPENAI_API_KEY;
        let anthropicKey = process.env.ANTHROPIC_API_KEY;

        // 2. Fallback: read from DB config (SystemConfig table)
        if (!openaiKey && !anthropicKey) {
            try {
                const configs = await this.prisma.systemConfig.findMany({
                    where: { category: 'ai' },
                });
                const map: Record<string, string> = {};
                configs.forEach((c: any) => { map[c.key] = c.value; });

                if (!preferredProvider && map['AI_PROVIDER']) preferredProvider = map['AI_PROVIDER'].toLowerCase();
                if (!openaiKey && map['OPENAI_API_KEY']) openaiKey = map['OPENAI_API_KEY'];
                if (!anthropicKey && map['ANTHROPIC_API_KEY']) anthropicKey = map['ANTHROPIC_API_KEY'];

                if (openaiKey || anthropicKey) {
                    this.logger.log('📦 AI keys loaded from database config');
                }
            } catch (e) {
                this.logger.warn('⚠️ Could not read SystemConfig table (may need migration)');
            }
        }

        // Try preferred provider first, then fallback
        if (preferredProvider === 'openai' || (!preferredProvider && openaiKey)) {
            if (openaiKey) {
                try {
                    const OpenAI = (await import('openai')).default;
                    this.openaiClient = new OpenAI({ apiKey: openaiKey });
                    this.aiProvider = 'openai';
                    this.isAIEnabled = true;
                    this.logger.log('✅ OpenAI GPT initialized (provider: openai)');
                    return;
                } catch (error) {
                    this.logger.error('❌ Failed to initialize OpenAI SDK:', error);
                }
            } else {
                this.logger.warn('⚠️ AI_PROVIDER=openai but OPENAI_API_KEY not set');
            }
        }

        if (preferredProvider === 'anthropic' || (!preferredProvider && anthropicKey) || (preferredProvider === 'openai' && !openaiKey)) {
            if (anthropicKey) {
                try {
                    const Anthropic = (await import('@anthropic-ai/sdk')).default;
                    this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
                    this.aiProvider = 'anthropic';
                    this.isAIEnabled = true;
                    this.logger.log('✅ Anthropic Claude initialized (provider: anthropic)');
                    return;
                } catch (error) {
                    this.logger.error('❌ Failed to initialize Anthropic SDK:', error);
                }
            } else {
                this.logger.warn('⚠️ AI_PROVIDER=anthropic but ANTHROPIC_API_KEY not set');
            }
        }

        if (!this.isAIEnabled) {
            this.logger.warn('⚠️ No AI API key configured — AI features disabled, using keyword search fallback');
            this.logger.warn('   Set keys via Super Admin ➜ التكاملات, or in .env file');
        }
    }

    // ══════════════════════════════════════════════════════════
    // 💬 AI QUESTION ANSWERING
    // ══════════════════════════════════════════════════════════

    async askAI(
        query: string,
        tenantId: string,
        userId: string,
    ): Promise<{
        answer: string;
        citations: any[];
        sources: any;
        confidence: number;
        tokensUsed: number;
        cached: boolean;
        responseTime: number;
        aiEnabled: boolean;
        provider: string | null;
    }> {
        const startTime = Date.now();

        // 1. Check cache first
        const queryHash = this.hashQuestion(query);
        const cacheKey = this.cacheService.buildKey('legal-ai', queryHash);
        const cached = await this.cacheService.get<any>(cacheKey);

        if (cached) {
            await this.trackUsage(tenantId, userId, 0, true);
            await this.logSearch(tenantId, userId, query, cached, Date.now() - startTime, true);
            return {
                ...cached,
                cached: true,
                responseTime: Date.now() - startTime,
                aiEnabled: this.isAIEnabled,
                provider: this.aiProvider,
            };
        }

        // 2. Search for relevant articles & precedents
        const searchResults = await this.searchRelevantContent(query);

        // 3. If AI not enabled, return keyword results only
        if (!this.isAIEnabled) {
            const fallbackResponse = {
                answer: this.buildFallbackAnswer(query, searchResults),
                citations: this.extractCitationsFromSearch(searchResults),
                sources: searchResults,
                confidence: 0,
                tokensUsed: 0,
                cached: false,
                responseTime: Date.now() - startTime,
                aiEnabled: false,
                provider: null,
            };
            await this.logSearch(tenantId, userId, query, fallbackResponse, Date.now() - startTime, false);
            return fallbackResponse;
        }

        // 4. Check monthly quota
        const hasQuota = await this.checkQuota(tenantId);
        if (!hasQuota) {
            throw new BadRequestException('تم تجاوز حد الأسئلة الشهري. يرجى الترقية أو الانتظار حتى الشهر القادم.');
        }

        // 5. Build context from search results
        const context = this.buildContext(searchResults);

        // 6. Call AI (OpenAI or Anthropic)
        try {
            const { answer, tokensUsed } = await this.callAI(context, query);

            // 7. Extract citations from AI answer
            const citations = this.extractCitationsFromAnswer(answer, searchResults);

            // 8. Calculate confidence
            const confidence = this.calculateConfidence(searchResults);

            const result = {
                answer,
                citations,
                sources: searchResults,
                confidence,
                tokensUsed,
            };

            // 9. Cache the result (30 days)
            await this.cacheService.set(cacheKey, result, 30 * 24 * 60 * 60);

            // 10. Track usage
            await this.trackUsage(tenantId, userId, tokensUsed, false);

            // 11. Log search
            await this.logSearch(tenantId, userId, query, result, Date.now() - startTime, false);

            return {
                ...result,
                cached: false,
                responseTime: Date.now() - startTime,
                aiEnabled: true,
                provider: this.aiProvider,
            };
        } catch (error) {
            this.logger.error(`❌ ${this.aiProvider} API error:`, error);
            // Fallback to keyword results
            const fallbackResponse = {
                answer: 'حدث خطأ أثناء تحليل السؤال بالذكاء الاصطناعي. إليك النتائج المتاحة من البحث:' +
                    '\n\n' + this.buildFallbackAnswer(query, searchResults),
                citations: this.extractCitationsFromSearch(searchResults),
                sources: searchResults,
                confidence: 0,
                tokensUsed: 0,
                cached: false,
                responseTime: Date.now() - startTime,
                aiEnabled: true,
                provider: this.aiProvider,
            };
            await this.logSearch(tenantId, userId, query, fallbackResponse, Date.now() - startTime, false);
            return fallbackResponse;
        }
    }

    // ══════════════════════════════════════════════════════════
    // 🔍 SEARCH RELEVANT CONTENT
    // ══════════════════════════════════════════════════════════

    private async searchRelevantContent(query: string) {
        const [regulations, articles, precedents, terms] = await Promise.all([
            // Search regulations
            this.prisma.legalRegulation.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { contentText: { contains: query, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    category: true,
                    status: true,
                    number: true,
                    issuedBy: true,
                },
                take: 5,
            }),

            // Search articles
            this.prisma.regulationArticle.findMany({
                where: {
                    OR: [
                        { content: { contains: query, mode: 'insensitive' } },
                        { title: { contains: query, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    content: true,
                    chapter: true,
                    section: true,
                    regulation: {
                        select: {
                            id: true,
                            title: true,
                            category: true,
                        },
                    },
                },
                take: 10,
            }),

            // Search precedents
            this.prisma.legalPrecedent.findMany({
                where: {
                    OR: [
                        { summary: { contains: query, mode: 'insensitive' } },
                        { legalPrinciple: { contains: query, mode: 'insensitive' } },
                        { keywords: { has: query } },
                    ],
                },
                select: {
                    id: true,
                    court: true,
                    caseType: true,
                    summary: true,
                    legalPrinciple: true,
                    judgmentDate: true,
                    outcome: true,
                },
                take: 5,
            }),

            // Search terms
            this.prisma.legalTerm.findMany({
                where: {
                    OR: [
                        { termAr: { contains: query, mode: 'insensitive' } },
                        { termEn: { contains: query, mode: 'insensitive' } },
                        { definition: { contains: query, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, termAr: true, termEn: true, definition: true },
                take: 5,
            }),
        ]);

        return { regulations, articles, precedents, terms };
    }

    // ══════════════════════════════════════════════════════════
    // 📊 USAGE & QUOTA
    // ══════════════════════════════════════════════════════════

    async getUsageStats(tenantId: string, userId?: string) {
        const currentMonth = this.getCurrentMonth();

        const where: any = { tenantId, month: currentMonth };
        if (userId) where.userId = userId;

        const usage = await this.prisma.legalAIUsage.findMany({
            where,
            include: { user: { select: { name: true, email: true } } },
        });

        const totals = usage.reduce(
            (acc, u) => ({
                questionsCount: acc.questionsCount + u.questionsCount,
                tokensUsed: acc.tokensUsed + u.tokensUsed,
                cacheHits: acc.cacheHits + u.cacheHits,
                cacheMisses: acc.cacheMisses + u.cacheMisses,
            }),
            { questionsCount: 0, tokensUsed: 0, cacheHits: 0, cacheMisses: 0 },
        );

        return {
            month: currentMonth,
            totals,
            byUser: usage,
            quota: {
                monthly: 100, // monthly question limit
                used: totals.questionsCount,
                remaining: Math.max(0, 100 - totals.questionsCount),
            },
            aiEnabled: this.isAIEnabled,
        };
    }

    async checkQuota(tenantId: string): Promise<boolean> {
        const currentMonth = this.getCurrentMonth();

        const totalUsage = await this.prisma.legalAIUsage.aggregate({
            where: { tenantId, month: currentMonth },
            _sum: { questionsCount: true },
        });

        const MONTHLY_LIMIT = 100;
        return (totalUsage._sum.questionsCount || 0) < MONTHLY_LIMIT;
    }

    // ══════════════════════════════════════════════════════════
    // 📝 ARTICLE NOTES
    // ══════════════════════════════════════════════════════════

    async createNote(
        articleId: string,
        tenantId: string,
        userId: string,
        data: { noteText: string; highlightStart?: number; highlightEnd?: number; isPrivate?: boolean },
    ) {
        return this.prisma.legalArticleNote.create({
            data: {
                articleId,
                tenantId,
                createdBy: userId,
                noteText: data.noteText,
                highlightStart: data.highlightStart,
                highlightEnd: data.highlightEnd,
                isPrivate: data.isPrivate ?? true,
            },
            include: {
                user: { select: { name: true } },
            },
        });
    }

    async getNotes(articleId: string, tenantId: string, userId: string) {
        return this.prisma.legalArticleNote.findMany({
            where: {
                articleId,
                tenantId,
                OR: [
                    { createdBy: userId },
                    { isPrivate: false },
                ],
            },
            include: {
                user: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteNote(noteId: string, tenantId: string, userId: string) {
        const note = await this.prisma.legalArticleNote.findFirst({
            where: { id: noteId, tenantId, createdBy: userId },
        });
        if (!note) throw new BadRequestException('الملاحظة غير موجودة');

        return this.prisma.legalArticleNote.delete({ where: { id: noteId } });
    }

    // ══════════════════════════════════════════════════════════
    // 🤖 UNIFIED AI CALL (OpenAI / Anthropic)
    // ══════════════════════════════════════════════════════════

    private async callAI(context: string, query: string): Promise<{ answer: string; tokensUsed: number }> {
        const userMessage = `${context}\n\nالسؤال: ${query}`;

        if (this.aiProvider === 'openai') {
            const response = await this.openaiClient.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o',
                max_tokens: 2000,
                messages: [
                    { role: 'system', content: this.getSystemPrompt() },
                    { role: 'user', content: userMessage },
                ],
            });

            const answer = response.choices?.[0]?.message?.content || 'لم أتمكن من تحليل السؤال.';
            const tokensUsed = (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0);
            return { answer, tokensUsed };
        }

        // Anthropic (default)
        const response = await this.anthropicClient.messages.create({
            model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            system: this.getSystemPrompt(),
            messages: [
                { role: 'user', content: userMessage },
            ],
        });

        const answer = response.content[0]?.type === 'text'
            ? response.content[0].text
            : 'لم أتمكن من تحليل السؤال.';
        const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
        return { answer, tokensUsed };
    }

    // ══════════════════════════════════════════════════════════
    // 🔧 PRIVATE HELPERS
    // ══════════════════════════════════════════════════════════

    private getSystemPrompt(): string {
        return `أنت مساعد قانوني متخصص في الأنظمة واللوائح السعودية. اسمك "وثيق AI".

مهمتك:
1. تحليل السؤال القانوني بدقة
2. الاستناد فقط على المواد القانونية المقدمة في السياق
3. تقديم إجابة واضحة ومباشرة
4. ذكر المادة والنظام بوضوح

قواعد مهمة:
- لا تخترع معلومات — اعتمد فقط على السياق المقدم
- إذا لم تجد إجابة واضحة في السياق، قل "لا تتوفر معلومات كافية في قاعدة البيانات للإجابة على هذا السؤال بدقة"
- اذكر رقم المادة والنظام في كل مرة تستند لها
- استخدم لغة قانونية دقيقة ولكن مفهومة
- نسّق الإجابة بشكل واضح مع فقرات

تنسيق الإجابة:
[الإجابة المباشرة بفقرات واضحة]

المراجع القانونية:
- المادة [رقم] من [اسم النظام]`;
    }

    private buildContext(searchResults: any): string {
        let context = 'السياق القانوني:\n\n';

        if (searchResults.articles?.length) {
            context += '═══ مواد الأنظمة ═══\n';
            searchResults.articles.forEach((art: any, i: number) => {
                context += `\n[${i + 1}] النظام: ${art.regulation?.title || 'غير محدد'}\n`;
                context += `المادة ${art.number}${art.title ? `: ${art.title}` : ''}\n`;
                context += `النص: ${art.content}\n`;
                context += '---\n';
            });
        }

        if (searchResults.precedents?.length) {
            context += '\n═══ السوابق القضائية ═══\n';
            searchResults.precedents.forEach((p: any, i: number) => {
                context += `\n[${i + 1}] المحكمة: ${p.court} | النوع: ${p.caseType}\n`;
                context += `المبدأ: ${p.legalPrinciple}\n`;
                if (p.summary) context += `الملخص: ${p.summary.substring(0, 300)}\n`;
                context += '---\n';
            });
        }

        if (searchResults.regulations?.length) {
            context += '\n═══ الأنظمة ذات الصلة ═══\n';
            searchResults.regulations.forEach((r: any) => {
                context += `- ${r.title} (${r.category}) — ${r.issuedBy || ''}\n`;
            });
        }

        if (searchResults.terms?.length) {
            context += '\n═══ مصطلحات ═══\n';
            searchResults.terms.forEach((t: any) => {
                context += `- ${t.termAr}: ${t.definition?.substring(0, 150)}\n`;
            });
        }

        return context || 'لم يتم العثور على مصادر مطابقة في قاعدة البيانات.';
    }

    private buildFallbackAnswer(query: string, results: any): string {
        let answer = `نتائج البحث عن "${query}":\n\n`;

        if (results.articles?.length) {
            answer += '📜 المواد القانونية:\n';
            results.articles.forEach((a: any) => {
                answer += `• المادة ${a.number} — ${a.regulation?.title || ''}\n`;
            });
            answer += '\n';
        }

        if (results.precedents?.length) {
            answer += '⚖️ السوابق القضائية:\n';
            results.precedents.forEach((p: any) => {
                answer += `• ${p.court}: ${p.summary?.substring(0, 100)}...\n`;
            });
            answer += '\n';
        }

        if (results.regulations?.length) {
            answer += '📖 الأنظمة:\n';
            results.regulations.forEach((r: any) => {
                answer += `• ${r.title}\n`;
            });
            answer += '\n';
        }

        if (results.terms?.length) {
            answer += '📚 المصطلحات:\n';
            results.terms.forEach((t: any) => {
                answer += `• ${t.termAr}: ${t.definition?.substring(0, 80)}...\n`;
            });
        }

        if (!results.articles?.length && !results.precedents?.length && !results.regulations?.length && !results.terms?.length) {
            answer = 'لم يتم العثور على نتائج مطابقة. حاول استخدام كلمات مختلفة.';
        }

        return answer;
    }

    private extractCitationsFromAnswer(answer: string, searchResults: any): any[] {
        const citations: any[] = [];

        // Match article references in the AI answer
        searchResults.articles?.forEach((article: any) => {
            if (answer.includes(article.number) || answer.includes(`المادة ${article.number}`)) {
                citations.push({
                    type: 'article',
                    articleId: article.id,
                    articleNumber: article.number,
                    articleTitle: article.title,
                    regulationTitle: article.regulation?.title,
                    regulationId: article.regulation?.id,
                });
            }
        });

        return citations;
    }

    private extractCitationsFromSearch(searchResults: any): any[] {
        return (searchResults.articles || []).slice(0, 5).map((a: any) => ({
            type: 'article',
            articleId: a.id,
            articleNumber: a.number,
            articleTitle: a.title,
            regulationTitle: a.regulation?.title,
            regulationId: a.regulation?.id,
        }));
    }

    private calculateConfidence(searchResults: any): number {
        const totalResults =
            (searchResults.articles?.length || 0) +
            (searchResults.precedents?.length || 0) +
            (searchResults.regulations?.length || 0);

        if (totalResults === 0) return 0.1;
        if (totalResults <= 2) return 0.5;
        if (totalResults <= 5) return 0.7;
        return Math.min(0.9, 0.6 + totalResults * 0.03);
    }

    private async trackUsage(tenantId: string, userId: string, tokensUsed: number, cacheHit: boolean) {
        const currentMonth = this.getCurrentMonth();

        try {
            await this.prisma.legalAIUsage.upsert({
                where: {
                    tenantId_userId_month: { tenantId, userId, month: currentMonth },
                },
                create: {
                    tenantId,
                    userId,
                    month: currentMonth,
                    questionsCount: 1,
                    tokensUsed,
                    cacheHits: cacheHit ? 1 : 0,
                    cacheMisses: cacheHit ? 0 : 1,
                },
                update: {
                    questionsCount: { increment: 1 },
                    tokensUsed: { increment: tokensUsed },
                    cacheHits: { increment: cacheHit ? 1 : 0 },
                    cacheMisses: { increment: cacheHit ? 0 : 1 },
                },
            });
        } catch (error) {
            this.logger.error('Failed to track AI usage:', error);
        }
    }

    private async logSearch(
        tenantId: string,
        userId: string,
        query: string,
        result: any,
        responseTime: number,
        cached: boolean,
    ) {
        try {
            await this.prisma.legalSearchLog.create({
                data: {
                    query,
                    results: result.sources || {},
                    tenantId,
                    createdBy: userId,
                    queryType: 'AI_QUESTION',
                    aiResponse: result.answer,
                    aiCitations: result.citations,
                    aiTokensUsed: result.tokensUsed || 0,
                    responseTime,
                    cached,
                },
            });
        } catch (error) {
            this.logger.error('Failed to log AI search:', error);
        }
    }

    private hashQuestion(question: string): string {
        return crypto
            .createHash('md5')
            .update(question.trim().toLowerCase())
            .digest('hex');
    }

    private getCurrentMonth(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
}
