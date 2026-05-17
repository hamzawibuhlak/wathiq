import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

// =====================================================================
// AI CONFIG KEYS — KV pairs stored in SystemConfig (category='ai')
// =====================================================================
export const AI_KEYS = {
  PROVIDER: 'AI_PROVIDER',            // 'openai' | 'anthropic' | 'openrouter'
  OPENAI_KEY: 'OPENAI_API_KEY',
  OPENAI_MODEL: 'OPENAI_MODEL',
  ANTHROPIC_KEY: 'ANTHROPIC_API_KEY',
  ANTHROPIC_MODEL: 'ANTHROPIC_MODEL',
  OPENROUTER_KEY: 'OPENROUTER_API_KEY',
  OPENROUTER_MODEL: 'OPENROUTER_MODEL',
} as const;

export const PROMPT_KEYS = {
  LEGAL_SEARCH:    'AI_PROMPT_LEGAL_SEARCH',
  SUMMARIZE:       'AI_PROMPT_SUMMARIZE',
  ANALYZE_CASE:    'AI_PROMPT_ANALYZE_CASE',
  GENERATE_DRAFT:  'AI_PROMPT_GENERATE_DRAFT',
  CHAT:            'AI_PROMPT_CHAT',
  EXTRACT_INFO:    'AI_PROMPT_EXTRACT_INFO',
} as const;

export const DEFAULT_PROMPTS: Record<string, { label: string; description: string; prompt: string }> = {
  [PROMPT_KEYS.LEGAL_SEARCH]: {
    label: 'مساعد البحث القانوني',
    description: 'البحث الذكي في الأنظمة واللوائح السعودية مع الاستشهاد بالمواد',
    prompt: `أنت مساعد قانوني متخصص في الأنظمة واللوائح السعودية. اسمك "وسم الثقة AI".

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
- المادة [رقم] من [اسم النظام]`,
  },
  [PROMPT_KEYS.SUMMARIZE]: {
    label: 'تلخيص المستندات',
    description: 'تلخيص المستندات القانونية الطويلة',
    prompt: 'أنت مساعد قانوني محترف. قم بتلخيص المستند القانوني التالي بشكل موجز وواضح باللغة العربية.',
  },
  [PROMPT_KEYS.ANALYZE_CASE]: {
    label: 'تحليل القضايا',
    description: 'تحليل قوة القضية القانونية وتقييمها',
    prompt: 'أنت خبير قانوني سعودي متخصص في تحليل القضايا. أجب بتنسيق JSON فقط.',
  },
  [PROMPT_KEYS.GENERATE_DRAFT]: {
    label: 'صياغة المسودات',
    description: 'صياغة العقود والوثائق القانونية',
    prompt: 'أنت خبير في صياغة الوثائق القانونية في المملكة العربية السعودية. اصغ بأسلوب قانوني رسمي ودقيق.',
  },
  [PROMPT_KEYS.CHAT]: {
    label: 'المحادثة العامة',
    description: 'الإجابة على أسئلة قانونية عامة',
    prompt: `أنت مساعد قانوني ذكي لنظام وسم الثقة (Wasm Altheeqa).
ساعد المحامين في:
- الإجابة عن الأسئلة القانونية
- شرح الإجراءات القانونية السعودية
- تقديم نصائح عملية
- البحث في الأنظمة السعودية

كن دقيقاً ومحترفاً في إجاباتك. أجب باللغة العربية.`,
  },
  [PROMPT_KEYS.EXTRACT_INFO]: {
    label: 'استخراج المعلومات',
    description: 'استخراج الأسماء والتواريخ والمبالغ من النصوص',
    prompt: 'استخرج المعلومات الرئيسية من النص القانوني التالي. الرد بتنسيق JSON يتضمن: names, dates, amounts, locations, organizations.',
  },
};

@Injectable()
export class AiConfigService {
  private readonly logger = new Logger(AiConfigService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Read a single config value (DB → env → null).
   */
  async getValue(key: string): Promise<string | null> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    if (config?.value) return config.value;
    return process.env[key] || null;
  }

  /**
   * Read a system prompt — DB value falls back to default hardcoded.
   */
  async getPrompt(key: keyof typeof PROMPT_KEYS | string): Promise<string> {
    const actualKey = (PROMPT_KEYS as any)[key] || key;
    const val = await this.getValue(actualKey);
    if (val) return val;
    return DEFAULT_PROMPTS[actualKey]?.prompt || '';
  }

  /**
   * Write/upsert a config value.
   */
  async setValue(key: string, value: string, category = 'ai', label?: string) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      create: { key, value, category, label, encrypted: key.includes('KEY') },
      update: { value, label },
    });
  }

  /**
   * Get the full AI config (with API keys masked).
   */
  async getFullConfig() {
    const configs = await this.prisma.systemConfig.findMany({
      where: { category: 'ai' },
    });
    const map: Record<string, string> = {};
    configs.forEach((c) => { map[c.key] = c.value; });

    const mask = (val?: string) => {
      if (!val) return '';
      if (val.length <= 10) return '••••••';
      return '••••••' + val.slice(-6);
    };

    return {
      provider: map[AI_KEYS.PROVIDER] || process.env.AI_PROVIDER || 'openai',
      openai: {
        apiKey: mask(map[AI_KEYS.OPENAI_KEY] || process.env.OPENAI_API_KEY),
        model: map[AI_KEYS.OPENAI_MODEL] || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        configured: !!(map[AI_KEYS.OPENAI_KEY] || process.env.OPENAI_API_KEY),
      },
      anthropic: {
        apiKey: mask(map[AI_KEYS.ANTHROPIC_KEY] || process.env.ANTHROPIC_API_KEY),
        model: map[AI_KEYS.ANTHROPIC_MODEL] || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        configured: !!(map[AI_KEYS.ANTHROPIC_KEY] || process.env.ANTHROPIC_API_KEY),
      },
      openrouter: {
        apiKey: mask(map[AI_KEYS.OPENROUTER_KEY] || process.env.OPENROUTER_API_KEY),
        model: map[AI_KEYS.OPENROUTER_MODEL] || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        configured: !!(map[AI_KEYS.OPENROUTER_KEY] || process.env.OPENROUTER_API_KEY),
      },
    };
  }

  /**
   * Update AI config values.
   */
  async updateConfig(input: {
    provider?: string;
    openaiApiKey?: string;
    openaiModel?: string;
    anthropicApiKey?: string;
    anthropicModel?: string;
    openrouterApiKey?: string;
    openrouterModel?: string;
  }) {
    const writes: Array<{ key: string; value: string; label: string }> = [];

    if (input.provider) writes.push({ key: AI_KEYS.PROVIDER, value: input.provider, label: 'مزوّد الذكاء الاصطناعي' });

    // Only update API keys if not masked
    if (input.openaiApiKey && !input.openaiApiKey.startsWith('••')) {
      writes.push({ key: AI_KEYS.OPENAI_KEY, value: input.openaiApiKey, label: 'مفتاح OpenAI' });
    }
    if (input.openaiModel) writes.push({ key: AI_KEYS.OPENAI_MODEL, value: input.openaiModel, label: 'موديل OpenAI' });

    if (input.anthropicApiKey && !input.anthropicApiKey.startsWith('••')) {
      writes.push({ key: AI_KEYS.ANTHROPIC_KEY, value: input.anthropicApiKey, label: 'مفتاح Anthropic' });
    }
    if (input.anthropicModel) writes.push({ key: AI_KEYS.ANTHROPIC_MODEL, value: input.anthropicModel, label: 'موديل Anthropic' });

    if (input.openrouterApiKey && !input.openrouterApiKey.startsWith('••')) {
      writes.push({ key: AI_KEYS.OPENROUTER_KEY, value: input.openrouterApiKey, label: 'مفتاح OpenRouter' });
    }
    if (input.openrouterModel) writes.push({ key: AI_KEYS.OPENROUTER_MODEL, value: input.openrouterModel, label: 'موديل OpenRouter' });

    for (const w of writes) {
      await this.setValue(w.key, w.value, 'ai', w.label);
    }

    return this.getFullConfig();
  }

  /**
   * Get all system prompts with metadata.
   */
  async getAllPrompts() {
    const configs = await this.prisma.systemConfig.findMany({
      where: { category: 'ai_prompt' },
    });
    const stored: Record<string, string> = {};
    configs.forEach((c) => { stored[c.key] = c.value; });

    return Object.entries(DEFAULT_PROMPTS).map(([key, meta]) => ({
      key,
      label: meta.label,
      description: meta.description,
      prompt: stored[key] || meta.prompt,
      isCustom: !!stored[key],
      defaultPrompt: meta.prompt,
    }));
  }

  /**
   * Update a single system prompt.
   */
  async updatePrompt(key: string, prompt: string) {
    if (!DEFAULT_PROMPTS[key]) {
      throw new BadRequestException('مفتاح البرومت غير معروف');
    }
    return this.setValue(key, prompt, 'ai_prompt', DEFAULT_PROMPTS[key].label);
  }

  /**
   * Reset a prompt to its default.
   */
  async resetPrompt(key: string) {
    await this.prisma.systemConfig.deleteMany({ where: { key } });
    return { key, prompt: DEFAULT_PROMPTS[key]?.prompt || '' };
  }

  /**
   * Test the API key by calling a small endpoint.
   */
  async testConnection(provider: string) {
    const config = await this.getFullConfig();
    const isAvailable = provider === 'openai' ? config.openai.configured
                       : provider === 'anthropic' ? config.anthropic.configured
                       : provider === 'openrouter' ? config.openrouter.configured
                       : false;

    if (!isAvailable) {
      return { success: false, message: `لم يتم تكوين مفتاح ${provider}` };
    }

    try {
      if (provider === 'openai' || provider === 'openrouter') {
        const OpenAI = (await import('openai')).default;
        const apiKey = provider === 'openai'
          ? (await this.getValue(AI_KEYS.OPENAI_KEY))!
          : (await this.getValue(AI_KEYS.OPENROUTER_KEY))!;
        const baseURL = provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : undefined;
        const model = provider === 'openai'
          ? (await this.getValue(AI_KEYS.OPENAI_MODEL)) || 'gpt-4o-mini'
          : (await this.getValue(AI_KEYS.OPENROUTER_MODEL)) || 'openai/gpt-4o-mini';

        const client = new OpenAI({ apiKey, baseURL });
        const result = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: 'قل "تم الاتصال بنجاح" بالعربية فقط' }],
          max_tokens: 20,
        });
        return {
          success: true,
          message: 'تم الاتصال بنجاح',
          model,
          response: result.choices[0]?.message?.content,
        };
      }

      if (provider === 'anthropic') {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const apiKey = (await this.getValue(AI_KEYS.ANTHROPIC_KEY))!;
        const model = (await this.getValue(AI_KEYS.ANTHROPIC_MODEL)) || 'claude-3-5-sonnet-20241022';
        const client = new Anthropic({ apiKey });
        const result = await client.messages.create({
          model,
          max_tokens: 20,
          messages: [{ role: 'user', content: 'قل "تم الاتصال بنجاح" بالعربية فقط' }],
        });
        const text = result.content[0]?.type === 'text' ? result.content[0].text : '';
        return { success: true, message: 'تم الاتصال بنجاح', model, response: text };
      }

      return { success: false, message: 'مزوّد غير مدعوم' };
    } catch (err: any) {
      this.logger.error(`AI connection test failed (${provider}):`, err);
      return {
        success: false,
        message: err?.error?.message || err?.message || 'فشل الاتصال',
      };
    }
  }
}
