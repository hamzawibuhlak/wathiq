import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class LegalDocumentsService {
    constructor(private prisma: PrismaService) { }

    // =============================================
    // CRUD
    // =============================================

    async findAll(tenantId: string, filters?: {
        type?: string;
        status?: string;
        caseId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;

        const where: any = { tenantId };
        if (filters?.type) where.type = filters.type;
        if (filters?.status) where.status = filters.status;
        if (filters?.caseId) where.caseId = filters.caseId;
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { contentText: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [documents, total] = await Promise.all([
            this.prisma.legalDocument.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    type: true,
                    status: true,
                    version: true,
                    createdAt: true,
                    updatedAt: true,
                    aiGenerated: true,
                    creator: { select: { id: true, name: true } },
                    case: { select: { id: true, caseNumber: true, title: true } },
                    client: { select: { id: true, name: true } },
                },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.legalDocument.count({ where }),
        ]);

        return {
            data: documents,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string, tenantId: string) {
        const doc = await this.prisma.legalDocument.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, name: true } },
                case: { select: { id: true, caseNumber: true, title: true } },
                client: { select: { id: true, name: true } },
                versions: {
                    orderBy: { version: 'desc' },
                    take: 10,
                    include: {
                        user: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!doc || doc.tenantId !== tenantId) {
            throw new NotFoundException('الوثيقة غير موجودة');
        }

        return doc;
    }

    async create(
        tenantId: string,
        userId: string,
        data: {
            title: string;
            type: string;
            content?: string;
            caseId?: string;
            clientId?: string;
            templateId?: string;
            settings?: any;
        },
    ) {
        let content = data.content || this.getDefaultContent(data.type);

        // If using a template
        if (data.templateId) {
            const template = await this.prisma.legalDocTemplate.findUnique({
                where: { id: data.templateId },
            });
            if (template) {
                content = template.content;
                await this.prisma.legalDocTemplate.update({
                    where: { id: data.templateId },
                    data: { usageCount: { increment: 1 } },
                });
            }
        }

        return this.prisma.legalDocument.create({
            data: {
                title: data.title,
                type: data.type as any,
                content,
                contentText: this.stripHtml(content),
                caseId: data.caseId || undefined,
                clientId: data.clientId || undefined,
                settings: data.settings || this.getDefaultSettings(),
                createdBy: userId,
                tenantId,
            },
        });
    }

    async update(
        id: string,
        tenantId: string,
        userId: string,
        data: {
            title?: string;
            content?: string;
            status?: string;
            caseId?: string;
            clientId?: string;
            settings?: any;
            changeNote?: string;
        },
    ) {
        const doc = await this.findOne(id, tenantId);

        // Save version before update (only if content changed)
        if (data.content && data.content !== doc.content) {
            await this.prisma.legalDocumentVersion.create({
                data: {
                    documentId: id,
                    version: doc.version,
                    content: doc.content,
                    savedBy: userId,
                    changeNote: data.changeNote,
                },
            });
        }

        return this.prisma.legalDocument.update({
            where: { id },
            data: {
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.content !== undefined ? {
                    content: data.content,
                    contentText: this.stripHtml(data.content),
                    pdfUrl: null,
                    wordUrl: null,
                    version: { increment: 1 },
                } : {}),
                ...(data.status !== undefined ? { status: data.status as any } : {}),
                ...(data.caseId !== undefined ? { caseId: data.caseId || null } : {}),
                ...(data.clientId !== undefined ? { clientId: data.clientId || null } : {}),
                ...(data.settings !== undefined ? { settings: data.settings } : {}),
            },
        });
    }

    async delete(id: string, tenantId: string) {
        await this.findOne(id, tenantId);
        await this.prisma.legalDocument.delete({ where: { id } });
        return { success: true };
    }

    async duplicate(id: string, tenantId: string, userId: string) {
        const original = await this.findOne(id, tenantId);

        return this.prisma.legalDocument.create({
            data: {
                title: `${original.title} - نسخة`,
                type: original.type,
                content: original.content,
                contentText: original.contentText,
                settings: original.settings as any,
                caseId: original.caseId,
                clientId: original.clientId,
                createdBy: userId,
                tenantId,
            },
        });
    }

    // =============================================
    // VERSION HISTORY
    // =============================================

    async restoreVersion(
        documentId: string,
        versionId: string,
        tenantId: string,
        userId: string,
    ) {
        await this.findOne(documentId, tenantId);

        const version = await this.prisma.legalDocumentVersion.findUnique({
            where: { id: versionId },
        });

        if (!version || version.documentId !== documentId) {
            throw new NotFoundException('الإصدار غير موجود');
        }

        return this.update(documentId, tenantId, userId, {
            content: version.content,
            changeNote: `استعادة الإصدار ${version.version}`,
        });
    }

    // =============================================
    // EXPORT (simplified — uses HTML download for now)
    // =============================================

    async getExportHtml(id: string, tenantId: string) {
        const doc = await this.findOne(id, tenantId);
        const settings = (doc.settings as any) || this.getDefaultSettings();

        return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${doc.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { box-sizing: border-box; }
    body {
      font-family: 'Cairo', 'Arial', sans-serif;
      font-size: ${settings.fontSize || 14}px;
      line-height: ${settings.lineHeight || 1.8};
      color: #1a1a1a;
      direction: rtl;
      text-align: right;
      margin: 0;
      padding: ${settings.margins?.top || 25}mm ${settings.margins?.left || 25}mm ${settings.margins?.bottom || 25}mm ${settings.margins?.right || 30}mm;
    }
    h1 { font-size: 20px; font-weight: 700; margin: 16px 0; }
    h2 { font-size: 18px; font-weight: 700; margin: 14px 0; }
    h3 { font-size: 16px; font-weight: 600; margin: 12px 0; }
    p { margin: 8px 0; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    td, th { border: 1px solid #ccc; padding: 8px 12px; text-align: right; }
    th { background: #f5f5f5; font-weight: 700; }
    @media print { body { margin: 0; padding: 20mm 25mm; } }
    @page { size: A4; margin: 25mm 25mm; }
  </style>
</head>
<body>
  ${doc.content}
</body>
</html>`;
    }

    // =============================================
    // TEMPLATES
    // =============================================

    async getTemplates(tenantId: string, type?: string) {
        return this.prisma.legalDocTemplate.findMany({
            where: {
                OR: [
                    { isSystem: true },
                    { tenantId },
                ],
                isActive: true,
                ...(type ? { type: type as any } : {}),
            },
            select: {
                id: true,
                name: true,
                nameAr: true,
                type: true,
                description: true,
                isSystem: true,
                usageCount: true,
                variables: true,
                content: true,
            },
            orderBy: [
                { isSystem: 'desc' },
                { usageCount: 'desc' },
            ],
        });
    }

    async createTemplate(
        tenantId: string,
        data: {
            name: string;
            nameAr: string;
            type: string;
            content: string;
            description?: string;
            variables?: any[];
        },
    ) {
        return this.prisma.legalDocTemplate.create({
            data: {
                name: data.name,
                nameAr: data.nameAr,
                type: data.type as any,
                content: data.content,
                description: data.description,
                variables: data.variables || [],
                tenantId,
            },
        });
    }

    // =============================================
    // AI ASSISTANCE (uses existing AiService)
    // =============================================

    async generateWithAI(
        tenantId: string,
        data: {
            type: string;
            prompt: string;
            caseContext?: string;
            clientName?: string;
        },
    ) {
        // Return a structured prompt for the frontend to use with the existing AI endpoint
        const typeName = this.getDocTypeName(data.type);
        const generatedContent = this.getDefaultContent(data.type);

        return {
            content: generatedContent,
            typeName,
            message: 'تم إنشاء المحتوى الأولي. يمكنك تعديله حسب احتياجاتك.',
        };
    }

    // =============================================
    // SEARCH
    // =============================================

    async search(query: string, tenantId: string) {
        return this.prisma.legalDocument.findMany({
            where: {
                tenantId,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { contentText: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                title: true,
                type: true,
                status: true,
                updatedAt: true,
            },
            take: 10,
        });
    }

    // =============================================
    // HELPERS
    // =============================================

    private getDefaultContent(type: string): string {
        const templates: Record<string, string> = {
            DEFENSE_MEMO: `<div dir="rtl"><p style="text-align:center; font-size:18px; font-weight:bold;">بسم الله الرحمن الرحيم</p><h1 style="text-align:center;">مذكرة دفاع</h1><p>المقدمة من / [اسم المحامي]</p><p>المحكمة الموقرة،</p><p>تحية طيبة وبعد،</p><h3>أولاً: الوقائع</h3><p>[اكتب الوقائع هنا]</p><h3>ثانياً: الدفوع القانونية</h3><p>[اكتب الدفوع هنا]</p><h3>ثالثاً: الطلبات</h3><p>بناءً على ما سبق، يلتمس المدعى عليه من المحكمة الموقرة:</p><p>[اكتب الطلبات هنا]</p></div>`,
            REPLY: `<div dir="rtl"><p style="text-align:center; font-weight:bold;">بسم الله الرحمن الرحيم</p><h1 style="text-align:center;">رد على الدعوى</h1><p>المحكمة الموقرة،</p><p>نرد على ما جاء في صحيفة الدعوى على النحو الآتي:</p><h3>أولاً: الدفع الشكلي</h3><p>[اكتب الدفوع الشكلية]</p><h3>ثانياً: الرد الموضوعي</h3><p>[اكتب الرد هنا]</p></div>`,
            CONTRACT: `<div dir="rtl"><h1 style="text-align:center;">عقد</h1><p>تم هذا العقد في تاريخ: [التاريخ]</p><p><strong>الطرف الأول:</strong> [اسم الطرف الأول]</p><p><strong>الطرف الثاني:</strong> [اسم الطرف الثاني]</p><h3>البند الأول: موضوع العقد</h3><p>[اكتب موضوع العقد]</p><h3>البند الثاني: المدة</h3><p>[اكتب المدة]</p><h3>البند الثالث: المقابل المالي</h3><p>[اكتب المبلغ والشروط]</p></div>`,
            POWER_OF_ATTORNEY: `<div dir="rtl"><p style="text-align:center; font-weight:bold;">بسم الله الرحمن الرحيم</p><h1 style="text-align:center;">توكيل رسمي</h1><hr/><p>أنا الموكّل / <strong>[اسم الموكّل]</strong></p><p>أوكّل وأفوّض / <strong>[اسم الوكيل]</strong></p><p>ليقوم عني وبالنيابة عني بـ: [نطاق التوكيل]</p></div>`,
            APPEAL: `<div dir="rtl"><p style="text-align:center; font-weight:bold;">بسم الله الرحمن الرحيم</p><h1 style="text-align:center;">لائحة اعتراضية</h1><p>المحكمة الموقرة،</p><h3>أولاً: ملخص الحكم</h3><p>[ملخص الحكم المعترض عليه]</p><h3>ثانياً: أسباب الاعتراض</h3><p>[اكتب الأسباب]</p><h3>ثالثاً: الطلبات</h3><p>[اكتب الطلبات]</p></div>`,
            LEGAL_OPINION: `<div dir="rtl"><h1 style="text-align:center;">رأي قانوني</h1><h3>أولاً: تحديد المسألة القانونية</h3><p>[وصف المسألة]</p><h3>ثانياً: الإطار القانوني</h3><p>[النصوص ذات الصلة]</p><h3>ثالثاً: التحليل القانوني</h3><p>[التحليل]</p><h3>رابعاً: الرأي والتوصية</h3><p>[الرأي]</p></div>`,
        };

        return templates[type] || '<div dir="rtl"><p>ابدأ الكتابة هنا...</p></div>';
    }

    private getDefaultSettings() {
        return {
            pageSize: 'A4',
            margins: { top: 25, right: 30, bottom: 25, left: 25 },
            fontSize: 14,
            fontFamily: 'Cairo',
            lineHeight: 1.8,
            headerText: '',
            footerText: '',
            showPageNumbers: true,
            rtl: true,
        };
    }

    getDocTypeName(type: string): string {
        const names: Record<string, string> = {
            DEFENSE_MEMO: 'مذكرة دفاع',
            REPLY: 'رد على دعوى',
            CONTRACT: 'عقد',
            POWER_OF_ATTORNEY: 'توكيل رسمي',
            APPEAL: 'لائحة اعتراضية',
            COMPLAINT: 'شكوى',
            LEGAL_OPINION: 'رأي قانوني',
            SETTLEMENT: 'اتفاقية تسوية',
            LETTER: 'خطاب رسمي',
            OTHER: 'أخرى',
        };
        return names[type] || 'وثيقة قانونية';
    }

    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
}
