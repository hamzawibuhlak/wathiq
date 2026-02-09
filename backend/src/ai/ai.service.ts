import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private openai: OpenAI | null = null;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
            this.logger.log('OpenAI client initialized');
        } else {
            this.logger.warn('OPENAI_API_KEY not configured - AI features disabled');
        }
    }

    private ensureClient(): OpenAI {
        if (!this.openai) {
            throw new Error('خدمة الذكاء الاصطناعي غير متاحة. يرجى تكوين OPENAI_API_KEY.');
        }
        return this.openai;
    }

    /**
     * تلخيص المستندات القانونية
     */
    async summarizeDocument(text: string): Promise<{ summary: string }> {
        const client = this.ensureClient();

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'أنت مساعد قانوني محترف. قم بتلخيص المستند القانوني التالي بشكل موجز وواضح باللغة العربية.',
                },
                {
                    role: 'user',
                    content: `الرجاء تلخيص هذا المستند:\n\n${text.substring(0, 8000)}`,
                },
            ],
            temperature: 0.3,
            max_tokens: 500,
        });

        return {
            summary: response.choices[0]?.message?.content || 'لم يتم الحصول على ملخص',
        };
    }

    /**
     * تحليل قوة القضية
     */
    async analyzeCaseStrength(data: {
        title: string;
        description: string;
        caseType: string;
        evidences?: string[];
    }): Promise<{
        score: number;
        analysis: string;
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    }> {
        const client = this.ensureClient();

        const prompt = `
تحليل قوة القضية القانونية:

العنوان: ${data.title}
النوع: ${data.caseType}
الوصف: ${data.description}
الأدلة: ${data.evidences?.join(', ') || 'غير محددة'}

قدم تحليلاً قانونياً شاملاً يتضمن:
1. تقييم من 1-10
2. تحليل عام
3. نقاط القوة (قائمة)
4. نقاط الضعف (قائمة)
5. توصيات (قائمة)

الرجاء الرد بتنسيق JSON فقط.
        `;

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'أنت خبير قانوني سعودي متخصص في تحليل القضايا. أجب بتنسيق JSON فقط.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
            response_format: { type: 'json_object' },
        });

        try {
            const result = JSON.parse(response.choices[0]?.message?.content || '{}');
            return {
                score: result.score || 5,
                analysis: result.analysis || 'لم يتم الحصول على تحليل',
                strengths: result.strengths || [],
                weaknesses: result.weaknesses || [],
                recommendations: result.recommendations || [],
            };
        } catch {
            return {
                score: 5,
                analysis: 'حدث خطأ في التحليل',
                strengths: [],
                weaknesses: [],
                recommendations: [],
            };
        }
    }

    /**
     * صياغة مسودة قانونية
     */
    async generateLegalDraft(data: {
        documentType: string;
        parties: string[];
        terms: string[];
        additionalInfo?: string;
    }): Promise<{ draft: string }> {
        const client = this.ensureClient();

        const prompt = `
قم بإعداد مسودة ${data.documentType} تتضمن:

الأطراف: ${data.parties.join(', ')}
البنود: ${data.terms.join(', ')}
معلومات إضافية: ${data.additionalInfo || 'لا يوجد'}

الرجاء كتابة المسودة بصيغة قانونية احترافية وفقاً للأنظمة السعودية.
        `;

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'أنت محامٍ سعودي متخصص في صياغة المستندات القانونية.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });

        return {
            draft: response.choices[0]?.message?.content || 'لم يتم الحصول على مسودة',
        };
    }

    /**
     * المساعد الذكي للمحادثة
     */
    async chatAssistant(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<{ response: string }> {
        const client = this.ensureClient();

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `أنت مساعد قانوني ذكي لنظام وثيق (Watheeq). 
ساعد المحامين في:
- الإجابة عن الأسئلة القانونية
- شرح الإجراءات القانونية السعودية
- تقديم نصائح عملية
- البحث في الأنظمة السعودية

كن دقيقاً ومحترفاً في إجاباتك. أجب باللغة العربية.`,
                },
                ...messages.map((m) => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                })),
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        return {
            response: response.choices[0]?.message?.content || 'لم يتم الحصول على رد',
        };
    }

    /**
     * استخراج المعلومات الرئيسية من النص
     */
    async extractKeyInformation(text: string): Promise<{
        names: string[];
        dates: string[];
        amounts: string[];
        locations: string[];
        organizations: string[];
    }> {
        const client = this.ensureClient();

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'استخرج المعلومات الرئيسية من النص القانوني التالي. الرد بتنسيق JSON يتضمن: names, dates, amounts, locations, organizations.',
                },
                {
                    role: 'user',
                    content: text.substring(0, 4000),
                },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
        });

        try {
            const result = JSON.parse(response.choices[0]?.message?.content || '{}');
            return {
                names: result.names || [],
                dates: result.dates || [],
                amounts: result.amounts || [],
                locations: result.locations || [],
                organizations: result.organizations || [],
            };
        } catch {
            return {
                names: [],
                dates: [],
                amounts: [],
                locations: [],
                organizations: [],
            };
        }
    }

    /**
     * التحقق من حالة الخدمة
     */
    isAvailable(): boolean {
        return this.openai !== null;
    }
}
