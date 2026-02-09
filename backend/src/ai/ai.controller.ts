import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('status')
    @ApiOperation({ summary: 'Check AI service availability' })
    getStatus() {
        return {
            available: this.aiService.isAvailable(),
            message: this.aiService.isAvailable()
                ? 'خدمة الذكاء الاصطناعي متاحة'
                : 'خدمة الذكاء الاصطناعي غير متاحة - يرجى تكوين OPENAI_API_KEY',
        };
    }

    @Post('summarize')
    @ApiOperation({ summary: 'Summarize a legal document' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'النص المراد تلخيصه' },
            },
            required: ['text'],
        },
    })
    async summarizeDocument(@Body() body: { text: string }) {
        return this.aiService.summarizeDocument(body.text);
    }

    @Post('analyze-case')
    @ApiOperation({ summary: 'Analyze case strength' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'عنوان القضية' },
                description: { type: 'string', description: 'وصف القضية' },
                caseType: { type: 'string', description: 'نوع القضية' },
                evidences: { type: 'array', items: { type: 'string' }, description: 'الأدلة' },
            },
            required: ['title', 'description', 'caseType'],
        },
    })
    async analyzeCase(
        @Body()
        body: {
            title: string;
            description: string;
            caseType: string;
            evidences?: string[];
        },
    ) {
        return this.aiService.analyzeCaseStrength(body);
    }

    @Post('generate-draft')
    @ApiOperation({ summary: 'Generate a legal document draft' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                documentType: { type: 'string', description: 'نوع المستند (عقد، وكالة، مذكرة، إلخ)' },
                parties: { type: 'array', items: { type: 'string' }, description: 'الأطراف' },
                terms: { type: 'array', items: { type: 'string' }, description: 'البنود الرئيسية' },
                additionalInfo: { type: 'string', description: 'معلومات إضافية' },
            },
            required: ['documentType', 'parties', 'terms'],
        },
    })
    async generateDraft(
        @Body()
        body: {
            documentType: string;
            parties: string[];
            terms: string[];
            additionalInfo?: string;
        },
    ) {
        return this.aiService.generateLegalDraft(body);
    }

    @Post('chat')
    @ApiOperation({ summary: 'Chat with AI legal assistant' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                messages: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            role: { type: 'string', enum: ['user', 'assistant'] },
                            content: { type: 'string' },
                        },
                    },
                    description: 'سجل المحادثة',
                },
            },
            required: ['messages'],
        },
    })
    async chat(@Body() body: { messages: Array<{ role: 'user' | 'assistant'; content: string }> }) {
        return this.aiService.chatAssistant(body.messages);
    }

    @Post('extract-info')
    @ApiOperation({ summary: 'Extract key information from text' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'النص المراد استخراج المعلومات منه' },
            },
            required: ['text'],
        },
    })
    async extractInfo(@Body() body: { text: string }) {
        return this.aiService.extractKeyInformation(body.text);
    }
}
