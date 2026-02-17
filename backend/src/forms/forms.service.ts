import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EntityCodeService } from '../common/services/entity-code.service';

@Injectable()
export class FormsService {
    constructor(
        private prisma: PrismaService,
        private entityCodeService: EntityCodeService,
    ) { }

    // ══════════════════════════════════════════════════════════
    // CREATE FORM
    // ══════════════════════════════════════════════════════════

    async create(tenantId: string, userId: string, data: any) {
        const codeData = await this.entityCodeService.generateFlatCode(tenantId, 'form');

        const slug = this.generateSlug(data.title);
        const uniqueSlug = await this.ensureUniqueSlug(slug);

        const form = await this.prisma.form.create({
            data: {
                code: codeData.code,
                codeNumber: codeData.codeNumber,
                title: data.title,
                description: data.description || null,
                slug: uniqueSlug,
                isActive: data.isActive ?? true,
                isPublic: data.isPublic ?? true,
                allowMultiple: data.allowMultiple ?? false,
                requireAuth: data.requireAuth ?? false,
                theme: data.theme || 'light',
                coverImage: data.coverImage || null,
                accentColor: data.accentColor || '#3b82f6',
                notifyOnSubmit: data.notifyOnSubmit ?? true,
                notifyEmails: data.notifyEmails || [],
                successMessage: data.successMessage || 'شكراً لك! تم إرسال النموذج بنجاح',
                redirectUrl: data.redirectUrl || null,
                tenantId,
                createdBy: userId,
                caseId: data.caseId || null,
                fields: {
                    create: (data.fields || []).map((field: any, index: number) => ({
                        type: field.type,
                        label: field.label,
                        placeholder: field.placeholder || null,
                        helpText: field.helpText || null,
                        order: index,
                        width: field.width || 'full',
                        required: field.required || false,
                        validation: field.validation || undefined,
                        options: field.options || undefined,
                        conditionalShow: field.conditionalShow || undefined,
                        fileSettings: field.fileSettings || undefined,
                    })),
                },
            },
            include: {
                fields: { orderBy: { order: 'asc' } },
                _count: { select: { submissions: true } },
            },
        });

        return form;
    }

    // ══════════════════════════════════════════════════════════
    // GET ALL FORMS
    // ══════════════════════════════════════════════════════════

    async findAll(tenantId: string, filters?: any) {
        const where: any = { tenantId };

        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive === 'true' || filters.isActive === true;
        }

        if (filters?.caseId) {
            where.caseId = filters.caseId;
        }

        return this.prisma.form.findMany({
            where,
            include: {
                _count: { select: { submissions: true } },
                creator: { select: { id: true, name: true, avatar: true } },
                case: { select: { id: true, code: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ══════════════════════════════════════════════════════════
    // GET FORM BY ID (for editing)
    // ══════════════════════════════════════════════════════════

    async findById(id: string, tenantId: string) {
        const form = await this.prisma.form.findFirst({
            where: { id, tenantId },
            include: {
                fields: { orderBy: { order: 'asc' } },
                _count: { select: { submissions: true } },
                creator: { select: { id: true, name: true } },
            },
        });

        if (!form) throw new NotFoundException('النموذج غير موجود');
        return form;
    }

    // ══════════════════════════════════════════════════════════
    // GET FORM BY SLUG (Public Access)
    // ══════════════════════════════════════════════════════════

    async findBySlug(slug: string) {
        const form = await this.prisma.form.findUnique({
            where: { slug },
            include: {
                fields: { orderBy: { order: 'asc' } },
                tenant: { select: { name: true, logo: true } },
            },
        });

        if (!form) throw new NotFoundException('النموذج غير موجود');
        if (!form.isActive) throw new BadRequestException('النموذج غير مفعّل');

        // Strip sensitive fields
        const { notifyEmails, createdBy, autoReplyMessage, ...publicForm } = form as any;
        return publicForm;
    }

    // ══════════════════════════════════════════════════════════
    // UPDATE FORM
    // ══════════════════════════════════════════════════════════

    async update(id: string, tenantId: string, data: any) {
        const form = await this.prisma.form.findFirst({
            where: { id, tenantId },
        });

        if (!form) throw new NotFoundException('النموذج غير موجود');

        // If fields are being updated, delete old ones and create new
        if (data.fields) {
            await this.prisma.formField.deleteMany({ where: { formId: id } });
        }

        const { fields, ...formData } = data;

        return this.prisma.form.update({
            where: { id },
            data: {
                ...formData,
                ...(fields && {
                    fields: {
                        create: fields.map((field: any, index: number) => ({
                            type: field.type,
                            label: field.label,
                            placeholder: field.placeholder || null,
                            helpText: field.helpText || null,
                            order: index,
                            width: field.width || 'full',
                            required: field.required || false,
                            validation: field.validation || undefined,
                            options: field.options || undefined,
                            conditionalShow: field.conditionalShow || undefined,
                            fileSettings: field.fileSettings || undefined,
                        })),
                    },
                }),
            },
            include: {
                fields: { orderBy: { order: 'asc' } },
                _count: { select: { submissions: true } },
            },
        });
    }

    // ══════════════════════════════════════════════════════════
    // DELETE FORM
    // ══════════════════════════════════════════════════════════

    async delete(id: string, tenantId: string) {
        const form = await this.prisma.form.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { submissions: true } } },
        });

        if (!form) throw new NotFoundException('النموذج غير موجود');

        if (form._count.submissions > 0) {
            throw new BadRequestException(
                `لا يمكن حذف النموذج - يحتوي على ${form._count.submissions} إجابة. قم بتعطيله بدلاً من ذلك.`,
            );
        }

        await this.prisma.form.delete({ where: { id } });
        return { success: true, message: 'تم حذف النموذج بنجاح' };
    }

    // ══════════════════════════════════════════════════════════
    // SUBMIT FORM (Public)
    // ══════════════════════════════════════════════════════════

    async submitForm(slug: string, data: any, metadata: any) {
        const form = await this.prisma.form.findUnique({
            where: { slug },
            include: { fields: true },
        });

        if (!form || !form.isActive) {
            throw new BadRequestException('النموذج غير متاح');
        }

        // Check duplicate submissions
        if (!form.allowMultiple && data.submitterEmail) {
            const exists = await this.prisma.formSubmission.findFirst({
                where: { formId: form.id, submitterEmail: data.submitterEmail },
            });
            if (exists) {
                throw new BadRequestException('لقد قمت بتعبئة هذا النموذج مسبقاً');
            }
        }

        // Validate required fields
        const requiredFields = form.fields.filter(f => f.required);
        for (const field of requiredFields) {
            const answer = data.answers?.[field.id];
            if (answer === undefined || answer === null || answer === '') {
                throw new BadRequestException(`الحقل "${field.label}" مطلوب`);
            }
        }

        // Generate submission code
        const subCode = await this.generateSubmissionCode(form.id, form.code);

        // Save submission
        const submission = await this.prisma.formSubmission.create({
            data: {
                code: subCode.code,
                codeNumber: subCode.codeNumber,
                formId: form.id,
                submitterName: data.submitterName || null,
                submitterEmail: data.submitterEmail || null,
                submitterPhone: data.submitterPhone || null,
                ipAddress: metadata?.ip || null,
                userAgent: metadata?.userAgent || null,
                answers: {
                    create: Object.entries(data.answers || {}).map(([fieldId, value]) => ({
                        fieldId,
                        ...this.formatAnswerValue(value),
                    })),
                },
            },
            include: {
                answers: { include: { field: true } },
            },
        });

        return {
            success: true,
            submissionCode: submission.code,
            message: form.successMessage,
            redirectUrl: form.redirectUrl,
        };
    }

    // ══════════════════════════════════════════════════════════
    // GET SUBMISSIONS
    // ══════════════════════════════════════════════════════════

    async getSubmissions(formId: string, tenantId: string, filters?: any) {
        const form = await this.prisma.form.findFirst({
            where: { id: formId, tenantId },
        });

        if (!form) throw new NotFoundException('النموذج غير موجود');

        const where: any = { formId };

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.search) {
            where.OR = [
                { submitterName: { contains: filters.search, mode: 'insensitive' } },
                { submitterEmail: { contains: filters.search, mode: 'insensitive' } },
                { code: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const submissions = await this.prisma.formSubmission.findMany({
            where,
            include: {
                answers: { include: { field: true } },
            },
            orderBy: { submittedAt: 'desc' },
        });

        return { form, submissions };
    }

    // ══════════════════════════════════════════════════════════
    // UPDATE SUBMISSION STATUS
    // ══════════════════════════════════════════════════════════

    async updateSubmissionStatus(
        submissionId: string,
        tenantId: string,
        userId: string,
        data: { status: string; notes?: string },
    ) {
        const submission = await this.prisma.formSubmission.findFirst({
            where: { id: submissionId, form: { tenantId } },
        });

        if (!submission) throw new NotFoundException('الإجابة غير موجودة');

        return this.prisma.formSubmission.update({
            where: { id: submissionId },
            data: {
                status: data.status,
                notes: data.notes,
                reviewedBy: userId,
                reviewedAt: new Date(),
            },
            include: {
                answers: { include: { field: true } },
            },
        });
    }

    // ══════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^\w\u0621-\u064A\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50) || `form-${Date.now()}`;
    }

    private async ensureUniqueSlug(slug: string): Promise<string> {
        let uniqueSlug = slug;
        let counter = 1;

        while (true) {
            const existing = await this.prisma.form.findUnique({
                where: { slug: uniqueSlug },
            });

            if (!existing) break;

            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }

        return uniqueSlug;
    }

    private async generateSubmissionCode(formId: string, formCode: string) {
        const lastSub = await this.prisma.formSubmission.findFirst({
            where: { formId },
            orderBy: { codeNumber: 'desc' },
            select: { codeNumber: true },
        });

        const nextNumber = (lastSub?.codeNumber || 0) + 1;
        const code = `${formCode}_SUB${nextNumber.toString().padStart(5, '0')}`;

        return { code, codeNumber: nextNumber };
    }

    private formatAnswerValue(value: any) {
        if (typeof value === 'string') return { valueText: value };
        if (typeof value === 'number') return { valueNumber: value };
        if (typeof value === 'boolean') return { valueBoolean: value };
        if (value instanceof Date) return { valueDate: value };
        if (Array.isArray(value) || typeof value === 'object') return { valueJson: value };
        return { valueText: String(value) };
    }
}
