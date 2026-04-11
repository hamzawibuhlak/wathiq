import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EntityCodeService } from '../common/services/entity-code.service';
import { EmailService } from '../email/email.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import * as bcrypt from 'bcrypt';

type SubmissionAccessContext = { userId: string; isFormCreator: boolean; isInAllowed: boolean };

@Injectable()
export class FormsService {
    constructor(
        private prisma: PrismaService,
        private entityCodeService: EntityCodeService,
        private emailService: EmailService,
        private whatsappService: WhatsAppService,
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
                otpEnabled: data.otpEnabled ?? false,
                otpDeliveryMethod: data.otpDeliveryMethod || null,
                otpLength: data.otpLength ?? 6,
                otpExpiryMinutes: data.otpExpiryMinutes ?? 30,
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
                allowedUsers: data.allowedUserIds?.length
                    ? { connect: data.allowedUserIds.map((id: string) => ({ id })) }
                    : undefined,
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
                allowedUsers: { select: { id: true, name: true, email: true, avatar: true } },
                _count: { select: { submissions: true } },
            },
        });

        return form;
    }

    // ══════════════════════════════════════════════════════════
    // GET ALL FORMS (permission-filtered)
    // ══════════════════════════════════════════════════════════

    async findAll(tenantId: string, userId: string, filters?: any) {
        const where: any = {
            tenantId,
            OR: [
                { createdBy: userId },
                { allowedUsers: { some: { id: userId } } },
            ],
        };

        if (filters?.search) {
            where.AND = [
                {
                    OR: [
                        { title: { contains: filters.search, mode: 'insensitive' } },
                        { description: { contains: filters.search, mode: 'insensitive' } },
                    ],
                },
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
                allowedUsers: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ══════════════════════════════════════════════════════════
    // GET FORM BY ID (for editing)
    // ══════════════════════════════════════════════════════════

    async findById(id: string, tenantId: string, userId: string) {
        const form = await this.prisma.form.findFirst({
            where: { id, tenantId },
            include: {
                fields: { orderBy: { order: 'asc' } },
                _count: { select: { submissions: true } },
                creator: { select: { id: true, name: true } },
                allowedUsers: { select: { id: true, name: true, email: true, avatar: true } },
            },
        });

        if (!form) throw new NotFoundException('النموذج غير موجود');

        const isCreator = form.createdBy === userId;
        const isAllowed = form.allowedUsers.some(u => u.id === userId);
        if (!isCreator && !isAllowed) {
            throw new ForbiddenException('ليس لديك صلاحية الوصول لهذا النموذج');
        }

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

    async update(id: string, tenantId: string, userId: string, data: any) {
        const form = await this.prisma.form.findFirst({
            where: { id, tenantId },
            include: { allowedUsers: { select: { id: true } } },
        });

        if (!form) throw new NotFoundException('النموذج غير موجود');

        const isCreator = form.createdBy === userId;
        const isAllowed = form.allowedUsers.some(u => u.id === userId);
        if (!isCreator && !isAllowed) {
            throw new ForbiddenException('ليس لديك صلاحية تعديل هذا النموذج');
        }

        // If fields are being updated, delete old ones and create new
        if (data.fields) {
            await this.prisma.formField.deleteMany({ where: { formId: id } });
        }

        const { fields, allowedUserIds, ...formData } = data;

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
                ...(allowedUserIds && {
                    allowedUsers: {
                        set: allowedUserIds.map((uid: string) => ({ id: uid })),
                    },
                }),
            },
            include: {
                fields: { orderBy: { order: 'asc' } },
                allowedUsers: { select: { id: true, name: true, email: true, avatar: true } },
                _count: { select: { submissions: true } },
            },
        });
    }

    // ══════════════════════════════════════════════════════════
    // MANAGE ACCESS
    // ══════════════════════════════════════════════════════════

    async manageAccess(id: string, tenantId: string, userId: string, data: { add?: string[]; remove?: string[] }) {
        const form = await this.prisma.form.findFirst({
            where: { id, tenantId },
        });
        if (!form) throw new NotFoundException('النموذج غير موجود');
        if (form.createdBy !== userId) {
            throw new ForbiddenException('فقط منشئ النموذج يمكنه إدارة الصلاحيات');
        }

        return this.prisma.form.update({
            where: { id },
            data: {
                allowedUsers: {
                    ...(data.add?.length && { connect: data.add.map(uid => ({ id: uid })) }),
                    ...(data.remove?.length && { disconnect: data.remove.map(uid => ({ id: uid })) }),
                },
            },
            include: {
                allowedUsers: { select: { id: true, name: true, email: true, avatar: true } },
            },
        });
    }

    // ══════════════════════════════════════════════════════════
    // DELETE FORM (cascade: answers -> submissions -> tokens -> form)
    // ══════════════════════════════════════════════════════════

    async delete(id: string, tenantId: string, userId: string) {
        const form = await this.prisma.form.findFirst({
            where: { id, tenantId },
        });
        if (!form) throw new NotFoundException('النموذج غير موجود');
        if (form.createdBy !== userId) {
            throw new ForbiddenException('فقط منشئ النموذج يمكنه حذفه');
        }

        await this.prisma.$transaction(async tx => {
            const subs = await tx.formSubmission.findMany({
                where: { formId: id },
                select: { id: true },
            });
            const subIds = subs.map(s => s.id);
            if (subIds.length) {
                // Answers cascade-delete via FK, but cascading through answers to notes/discussions is fine too.
                await tx.formFieldAnswer.deleteMany({ where: { submissionId: { in: subIds } } });
                await tx.formSubmission.deleteMany({ where: { id: { in: subIds } } });
            }
            await tx.formAccessToken.deleteMany({ where: { formId: id } });
            await tx.formField.deleteMany({ where: { formId: id } });
            await tx.form.delete({ where: { id } });
        });

        return { success: true, message: 'تم حذف النموذج وجميع إجاباته بنجاح' };
    }

    // ══════════════════════════════════════════════════════════
    // SUBMIT FORM (Public) — honors OTP gate
    // ══════════════════════════════════════════════════════════

    async submitForm(slug: string, data: any, metadata: any) {
        const form = await this.prisma.form.findUnique({
            where: { slug },
            include: { fields: true },
        });

        if (!form || !form.isActive) {
            throw new BadRequestException('النموذج غير متاح');
        }

        // OTP gate
        if (form.otpEnabled) {
            if (!data.otpCode) {
                throw new BadRequestException('رمز الدخول مطلوب');
            }
            await this.consumeOtp(form.id, data.otpCode, metadata?.ip);
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
    // GET SUBMISSIONS — permission-filtered per answer
    // ══════════════════════════════════════════════════════════

    async getSubmissions(formId: string, tenantId: string, userId: string, filters?: any) {
        const form = await this.prisma.form.findFirst({
            where: { id: formId, tenantId },
            include: { allowedUsers: { select: { id: true } } },
        });

        if (!form) throw new NotFoundException('النموذج غير موجود');

        const isCreator = form.createdBy === userId;
        const isAllowed = form.allowedUsers.some(u => u.id === userId);
        if (!isCreator && !isAllowed) {
            throw new ForbiddenException('ليس لديك صلاحية الاطلاع على إجابات هذا النموذج');
        }

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
                answers: {
                    include: {
                        field: true,
                        visibleToUsers: { select: { id: true, name: true, avatar: true } },
                        notes: {
                            include: { author: { select: { id: true, name: true, avatar: true } } },
                            orderBy: { createdAt: 'desc' },
                        },
                        discussion: {
                            include: {
                                participants: { select: { id: true, name: true, avatar: true } },
                                _count: { select: { messages: true } },
                            },
                        },
                    },
                },
                linkedClient: { select: { id: true, name: true, code: true } },
                linkedCase: { select: { id: true, title: true, code: true } },
                linkedHearing: { select: { id: true, code: true, hearingDate: true } },
                convertedToClient: { select: { id: true, name: true, code: true } },
                convertedToCase: { select: { id: true, title: true, code: true } },
            },
            orderBy: { submittedAt: 'desc' },
        });

        // Post-filter answer visibility: non-creators only see answers whose
        // visibleToUsers is empty (inherit form access) or contains userId.
        if (!isCreator) {
            for (const sub of submissions) {
                sub.answers = sub.answers.filter(a => {
                    const restricted = a.visibleToUsers.length > 0;
                    if (!restricted) return true;
                    return a.visibleToUsers.some(u => u.id === userId);
                });
            }
        }

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
    // PER-ANSWER VISIBILITY
    // ══════════════════════════════════════════════════════════

    async setAnswerVisibility(answerId: string, tenantId: string, userId: string, userIds: string[]) {
        const ctx = await this.assertAnswerCreatorAccess(answerId, tenantId, userId);
        if (!ctx.isFormCreator) {
            throw new ForbiddenException('فقط منشئ النموذج يمكنه تغيير صلاحية الاطلاع على الإجابة');
        }

        return this.prisma.formFieldAnswer.update({
            where: { id: answerId },
            data: {
                visibleToUsers: {
                    set: userIds.map(id => ({ id })),
                },
            },
            include: {
                visibleToUsers: { select: { id: true, name: true, avatar: true } },
            },
        });
    }

    // ══════════════════════════════════════════════════════════
    // OTP GENERATION & DELIVERY
    // ══════════════════════════════════════════════════════════

    async generateOtp(
        formId: string,
        tenantId: string,
        userId: string,
        data: { recipientEmail?: string; recipientPhone?: string; deliveryMethod?: string },
    ) {
        const form = await this.prisma.form.findFirst({
            where: { id: formId, tenantId },
            include: { tenant: true },
        });
        if (!form) throw new NotFoundException('النموذج غير موجود');
        if (!form.otpEnabled) {
            throw new BadRequestException('كلمات المرور لمرة واحدة غير مفعّلة لهذا النموذج');
        }

        const length = form.otpLength || 6;
        const code = this.generateOtpCode(length);
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + (form.otpExpiryMinutes || 30) * 60 * 1000);
        const deliveryMethod = data.deliveryMethod || form.otpDeliveryMethod || 'email';

        const token = await this.prisma.formAccessToken.create({
            data: {
                formId,
                codeHash,
                recipientEmail: data.recipientEmail || null,
                recipientPhone: data.recipientPhone || null,
                deliveryMethod,
                expiresAt,
                createdBy: userId,
            },
        });

        // Deliver
        const appUrl = process.env.APP_URL || 'https://app.bewathiq.com';
        const formUrl = `${appUrl}/public/forms/${form.slug}`;
        const message = `رمز الدخول للنموذج "${form.title}": ${code}\nصالح لمدة ${form.otpExpiryMinutes} دقيقة.\n${formUrl}`;

        let delivered = false;
        try {
            if (deliveryMethod === 'email' && data.recipientEmail) {
                const res = await this.emailService.sendEmail({
                    to: data.recipientEmail,
                    subject: `رمز الدخول للنموذج: ${form.title}`,
                    body: `<p>${message.replace(/\n/g, '<br>')}</p>`,
                    tenantId,
                });
                delivered = res.success;
            } else if ((deliveryMethod === 'whatsapp' || deliveryMethod === 'sms') && data.recipientPhone) {
                await this.whatsappService.sendTextMessage({
                    to: data.recipientPhone,
                    body: message,
                    tenantId,
                });
                delivered = true;
            }
        } catch (err) {
            // Log but don't fail — the admin can still share the code manually.
            delivered = false;
        }

        if (delivered) {
            await this.prisma.formAccessToken.update({
                where: { id: token.id },
                data: { deliveredAt: new Date() },
            });
        }

        return {
            id: token.id,
            code, // Returned once so the creator can copy it if delivery failed.
            deliveryMethod,
            delivered,
            expiresAt,
            formUrl,
        };
    }

    async verifyOtp(slug: string, code: string) {
        const form = await this.prisma.form.findUnique({ where: { slug }, select: { id: true, otpEnabled: true } });
        if (!form) throw new NotFoundException('النموذج غير موجود');
        if (!form.otpEnabled) return { valid: true };
        // Peek only — we don't consume here. Consumption happens on submit.
        const tokens = await this.prisma.formAccessToken.findMany({
            where: { formId: form.id, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        for (const t of tokens) {
            if (await bcrypt.compare(code, t.codeHash)) {
                return { valid: true };
            }
        }
        throw new BadRequestException('رمز غير صحيح أو منتهٍ');
    }

    private async consumeOtp(formId: string, code: string, ip?: string) {
        const tokens = await this.prisma.formAccessToken.findMany({
            where: { formId, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        for (const t of tokens) {
            if (await bcrypt.compare(code, t.codeHash)) {
                await this.prisma.formAccessToken.update({
                    where: { id: t.id },
                    data: { usedAt: new Date(), usedByIp: ip || null },
                });
                return;
            }
        }
        throw new BadRequestException('رمز الدخول غير صحيح أو منتهي الصلاحية');
    }

    private generateOtpCode(length: number): string {
        const digits = '0123456789';
        let out = '';
        for (let i = 0; i < length; i++) {
            out += digits[Math.floor(Math.random() * digits.length)];
        }
        return out;
    }

    // ══════════════════════════════════════════════════════════
    // LINK SUBMISSION TO CLIENT/CASE/HEARING
    // ══════════════════════════════════════════════════════════

    async linkSubmission(
        submissionId: string,
        tenantId: string,
        userId: string,
        data: { clientId?: string | null; caseId?: string | null; hearingId?: string | null },
    ) {
        const submission = await this.prisma.formSubmission.findFirst({
            where: { id: submissionId, form: { tenantId } },
            include: { form: { include: { allowedUsers: { select: { id: true } } } } },
        });
        if (!submission) throw new NotFoundException('الإجابة غير موجودة');

        const isCreator = submission.form.createdBy === userId;
        const isAllowed = submission.form.allowedUsers.some(u => u.id === userId);
        if (!isCreator && !isAllowed) {
            throw new ForbiddenException('ليس لديك صلاحية الربط');
        }

        return this.prisma.formSubmission.update({
            where: { id: submissionId },
            data: {
                linkedClientId: data.clientId ?? null,
                linkedCaseId: data.caseId ?? null,
                linkedHearingId: data.hearingId ?? null,
            },
            include: {
                linkedClient: { select: { id: true, name: true, code: true } },
                linkedCase: { select: { id: true, title: true, code: true } },
                linkedHearing: { select: { id: true, code: true, hearingDate: true } },
            },
        });
    }

    // ══════════════════════════════════════════════════════════
    // CONVERT SUBMISSION → NEW CLIENT
    // ══════════════════════════════════════════════════════════

    async convertToClient(submissionId: string, tenantId: string, userId: string) {
        const submission = await this.prisma.formSubmission.findFirst({
            where: { id: submissionId, form: { tenantId } },
            include: { answers: { include: { field: true } } },
        });
        if (!submission) throw new NotFoundException('الإجابة غير موجودة');
        if (submission.convertedToClientId) {
            throw new BadRequestException('هذه الإجابة تم تحويلها لعميل مسبقاً');
        }

        const mapped = this.mapAnswersToEntity(submission.answers);
        const name = mapped.name || submission.submitterName || `عميل من نموذج ${submission.code}`;

        const codeData = await this.entityCodeService.generateClientCode(tenantId);

        const client = await this.prisma.client.create({
            data: {
                name,
                email: mapped.email || submission.submitterEmail || null,
                phone: mapped.phone || submission.submitterPhone || null,
                nationalId: mapped.nationalId || null,
                address: mapped.address || null,
                city: mapped.city || null,
                notes: mapped.notes || `تم الإنشاء من إجابة نموذج ${submission.code}`,
                code: codeData.code,
                codeNumber: codeData.codeNumber,
                tenantId,
                visibleToUsers: { connect: [{ id: userId }] },
            },
        });

        await this.prisma.formSubmission.update({
            where: { id: submissionId },
            data: { convertedToClientId: client.id, linkedClientId: client.id },
        });

        return client;
    }

    // ══════════════════════════════════════════════════════════
    // CONVERT SUBMISSION → NEW CASE
    // ══════════════════════════════════════════════════════════

    async convertToCase(
        submissionId: string,
        tenantId: string,
        userId: string,
        data: { clientId?: string },
    ) {
        const submission = await this.prisma.formSubmission.findFirst({
            where: { id: submissionId, form: { tenantId } },
            include: { answers: { include: { field: true } } },
        });
        if (!submission) throw new NotFoundException('الإجابة غير موجودة');
        if (submission.convertedToCaseId) {
            throw new BadRequestException('هذه الإجابة تم تحويلها لقضية مسبقاً');
        }

        let clientId = data.clientId || submission.linkedClientId || submission.convertedToClientId;
        if (!clientId) {
            const client = await this.convertToClient(submissionId, tenantId, userId);
            clientId = client.id;
        }

        const mapped = this.mapAnswersToEntity(submission.answers);
        const title = mapped.title || mapped.caseTitle || `قضية من نموذج ${submission.code}`;

        const caseCode = await this.entityCodeService.generateCaseCode(clientId);

        // Tenant-scoped sequential caseNumber
        const lastCase = await this.prisma.case.findFirst({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            select: { caseNumber: true },
        });
        const nextNumber = (parseInt(lastCase?.caseNumber?.replace(/\D/g, '') || '0', 10) || 0) + 1;

        const caseRec = await this.prisma.case.create({
            data: {
                caseNumber: `C${String(nextNumber).padStart(5, '0')}`,
                code: caseCode.code,
                codeNumber: caseCode.codeNumber,
                title,
                description: mapped.description || mapped.notes || null,
                courtName: mapped.courtName || null,
                courtCaseNumber: mapped.courtCaseNumber || null,
                tenantId,
                clientId,
                createdById: userId,
                assignedToId: userId,
                notes: `تم الإنشاء من إجابة نموذج ${submission.code}`,
            },
        });

        await this.prisma.formSubmission.update({
            where: { id: submissionId },
            data: { convertedToCaseId: caseRec.id, linkedCaseId: caseRec.id },
        });

        return caseRec;
    }

    /**
     * Best-effort mapping from field labels/types to known entity keys.
     */
    private mapAnswersToEntity(answers: any[]): Record<string, any> {
        const result: Record<string, any> = {};
        for (const a of answers) {
            const label = (a.field?.label || '').toLowerCase();
            const type = a.field?.type;
            const value = a.valueText ?? a.valueNumber ?? a.valueDate ?? a.valueBoolean ?? a.valueJson;
            if (value == null || value === '') continue;

            if (type === 'email' || /بريد|email/i.test(label)) result.email ??= value;
            else if (type === 'phone' || /هاتف|جوال|phone/i.test(label)) result.phone ??= value;
            else if (/اسم|name|العميل/i.test(label) && !result.name) result.name = value;
            else if (/هوية|national|رقم هوية/i.test(label)) result.nationalId ??= value;
            else if (/عنوان النموذج|عنوان القضية|title/i.test(label)) result.title ??= value;
            else if (/مدينة|city/i.test(label)) result.city ??= value;
            else if (/عنوان|address/i.test(label)) result.address ??= value;
            else if (/وصف|description|ملاحظات|notes/i.test(label)) result.description ??= value;
            else if (/محكمة|court/i.test(label)) result.courtName ??= value;
        }
        return result;
    }

    // ══════════════════════════════════════════════════════════
    // ANSWER NOTES
    // ══════════════════════════════════════════════════════════

    async addAnswerNote(answerId: string, tenantId: string, userId: string, content: string) {
        await this.assertAnswerVisibility(answerId, tenantId, userId);
        if (!content?.trim()) throw new BadRequestException('الملاحظة فارغة');

        return this.prisma.formAnswerNote.create({
            data: { answerId, authorId: userId, tenantId, content: content.trim() },
            include: { author: { select: { id: true, name: true, avatar: true } } },
        });
    }

    async listAnswerNotes(answerId: string, tenantId: string, userId: string) {
        await this.assertAnswerVisibility(answerId, tenantId, userId);
        return this.prisma.formAnswerNote.findMany({
            where: { answerId, tenantId },
            include: { author: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteAnswerNote(answerId: string, noteId: string, tenantId: string, userId: string) {
        const note = await this.prisma.formAnswerNote.findFirst({
            where: { id: noteId, answerId, tenantId },
        });
        if (!note) throw new NotFoundException('الملاحظة غير موجودة');

        const ctx = await this.assertAnswerVisibility(answerId, tenantId, userId);
        if (note.authorId !== userId && !ctx.isFormCreator) {
            throw new ForbiddenException('لا يمكنك حذف ملاحظة ليست لك');
        }
        await this.prisma.formAnswerNote.delete({ where: { id: noteId } });
        return { success: true };
    }

    // ══════════════════════════════════════════════════════════
    // ANSWER DISCUSSIONS
    // ══════════════════════════════════════════════════════════

    async startDiscussion(
        answerId: string,
        tenantId: string,
        userId: string,
        data: { inviteeIds?: string[]; message?: string },
    ) {
        const ctx = await this.assertAnswerVisibility(answerId, tenantId, userId);

        const existing = await this.prisma.formAnswerDiscussion.findUnique({
            where: { answerId },
        });
        if (existing) return existing;

        const participants = new Set<string>([userId, ...(data.inviteeIds || [])]);
        // Always include the form creator to prevent orphaned discussions.
        participants.add(ctx.formCreatorId);

        const discussion = await this.prisma.formAnswerDiscussion.create({
            data: {
                answerId,
                tenantId,
                createdBy: userId,
                participants: { connect: Array.from(participants).map(id => ({ id })) },
                ...(data.message?.trim() && {
                    messages: {
                        create: { authorId: userId, content: data.message.trim() },
                    },
                }),
            },
            include: {
                participants: { select: { id: true, name: true, avatar: true } },
                messages: {
                    include: { author: { select: { id: true, name: true, avatar: true } } },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        return discussion;
    }

    async addDiscussionMessage(discussionId: string, tenantId: string, userId: string, content: string) {
        if (!content?.trim()) throw new BadRequestException('الرسالة فارغة');
        const discussion = await this.prisma.formAnswerDiscussion.findFirst({
            where: { id: discussionId, tenantId },
            include: { participants: { select: { id: true } }, answer: { include: { submission: { include: { form: { select: { createdBy: true } } } } } } },
        });
        if (!discussion) throw new NotFoundException('المناقشة غير موجودة');

        const isParticipant = discussion.participants.some(p => p.id === userId);
        const isFormCreator = discussion.answer.submission.form.createdBy === userId;
        if (!isParticipant && !isFormCreator) {
            throw new ForbiddenException('ليس لديك صلاحية الكتابة في هذه المناقشة');
        }

        return this.prisma.formAnswerMessage.create({
            data: { discussionId, authorId: userId, content: content.trim() },
            include: { author: { select: { id: true, name: true, avatar: true } } },
        });
    }

    async inviteToDiscussion(discussionId: string, tenantId: string, userId: string, inviteeIds: string[]) {
        const discussion = await this.prisma.formAnswerDiscussion.findFirst({
            where: { id: discussionId, tenantId },
            include: { answer: { include: { submission: { include: { form: { select: { createdBy: true } } } } } } },
        });
        if (!discussion) throw new NotFoundException('المناقشة غير موجودة');

        const isFormCreator = discussion.answer.submission.form.createdBy === userId;
        const isDiscussionCreator = discussion.createdBy === userId;
        if (!isFormCreator && !isDiscussionCreator) {
            throw new ForbiddenException('لا يمكنك دعوة مستخدمين في هذه المناقشة');
        }

        return this.prisma.formAnswerDiscussion.update({
            where: { id: discussionId },
            data: { participants: { connect: inviteeIds.map(id => ({ id })) } },
            include: { participants: { select: { id: true, name: true, avatar: true } } },
        });
    }

    async getDiscussion(discussionId: string, tenantId: string, userId: string) {
        const discussion = await this.prisma.formAnswerDiscussion.findFirst({
            where: { id: discussionId, tenantId },
            include: {
                participants: { select: { id: true, name: true, avatar: true } },
                messages: {
                    include: { author: { select: { id: true, name: true, avatar: true } } },
                    orderBy: { createdAt: 'asc' },
                },
                answer: { include: { submission: { include: { form: { select: { createdBy: true, title: true } } } } } },
            },
        });
        if (!discussion) throw new NotFoundException('المناقشة غير موجودة');

        const isParticipant = discussion.participants.some(p => p.id === userId);
        const isFormCreator = discussion.answer.submission.form.createdBy === userId;
        if (!isParticipant && !isFormCreator) {
            throw new ForbiddenException('ليس لديك صلاحية الاطلاع على هذه المناقشة');
        }

        return discussion;
    }

    // ══════════════════════════════════════════════════════════
    // EDITOR INTEGRATION: answers for a case/client scoped to user
    // ══════════════════════════════════════════════════════════

    async getAnswersForEditor(
        tenantId: string,
        userId: string,
        filters: { caseId?: string; clientId?: string },
    ) {
        const where: any = { form: { tenantId } };
        if (filters.caseId) where.linkedCaseId = filters.caseId;
        else if (filters.clientId) where.linkedClientId = filters.clientId;
        else throw new BadRequestException('يجب تحديد قضية أو عميل');

        const submissions = await this.prisma.formSubmission.findMany({
            where,
            include: {
                form: { select: { id: true, title: true, code: true, createdBy: true, allowedUsers: { select: { id: true } } } },
                answers: {
                    include: {
                        field: { select: { id: true, label: true, type: true } },
                        visibleToUsers: { select: { id: true } },
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });

        // Filter forms and answers by permissions
        return submissions
            .filter(s => {
                const isCreator = s.form.createdBy === userId;
                const isAllowed = s.form.allowedUsers.some(u => u.id === userId);
                return isCreator || isAllowed;
            })
            .map(s => {
                const isCreator = s.form.createdBy === userId;
                const answers = isCreator
                    ? s.answers
                    : s.answers.filter(a => a.visibleToUsers.length === 0 || a.visibleToUsers.some(u => u.id === userId));
                return {
                    id: s.id,
                    code: s.code,
                    form: { id: s.form.id, title: s.form.title, code: s.form.code },
                    submittedAt: s.submittedAt,
                    submitterName: s.submitterName,
                    answers: answers.map(a => ({
                        id: a.id,
                        fieldId: a.fieldId,
                        label: a.field.label,
                        type: a.field.type,
                        value: a.valueText ?? a.valueNumber ?? a.valueDate ?? a.valueBoolean ?? a.valueJson,
                    })),
                };
            });
    }

    // ══════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════

    private async assertAnswerVisibility(answerId: string, tenantId: string, userId: string) {
        const answer = await this.prisma.formFieldAnswer.findFirst({
            where: { id: answerId, submission: { form: { tenantId } } },
            include: {
                visibleToUsers: { select: { id: true } },
                submission: {
                    include: {
                        form: {
                            select: { createdBy: true, allowedUsers: { select: { id: true } } },
                        },
                    },
                },
            },
        });
        if (!answer) throw new NotFoundException('الإجابة غير موجودة');

        const formCreatorId = answer.submission.form.createdBy;
        const isFormCreator = formCreatorId === userId;
        const isAllowed = answer.submission.form.allowedUsers.some(u => u.id === userId);
        const restricted = answer.visibleToUsers.length > 0;
        const hasExplicit = answer.visibleToUsers.some(u => u.id === userId);

        if (!isFormCreator && !(isAllowed && (!restricted || hasExplicit))) {
            throw new ForbiddenException('ليس لديك صلاحية الوصول لهذه الإجابة');
        }
        return { isFormCreator, formCreatorId, isAllowed } as { isFormCreator: boolean; formCreatorId: string; isAllowed: boolean };
    }

    private async assertAnswerCreatorAccess(answerId: string, tenantId: string, userId: string) {
        const answer = await this.prisma.formFieldAnswer.findFirst({
            where: { id: answerId, submission: { form: { tenantId } } },
            include: { submission: { include: { form: { select: { createdBy: true } } } } },
        });
        if (!answer) throw new NotFoundException('الإجابة غير موجودة');
        const isFormCreator = answer.submission.form.createdBy === userId;
        return { isFormCreator, formCreatorId: answer.submission.form.createdBy };
    }

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
