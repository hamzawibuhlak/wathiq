import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DocumentType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export interface CreateTemplateDto {
    name: string;
    description?: string;
    category: DocumentType;
}

@Injectable()
export class TemplatesService {
    private readonly templatesDir = './uploads/templates';

    constructor(private prisma: PrismaService) {
        // Ensure templates directory exists
        if (!fs.existsSync(this.templatesDir)) {
            fs.mkdirSync(this.templatesDir, { recursive: true });
        }
    }

    /**
     * Create a new document template
     */
    async create(
        file: Express.Multer.File,
        dto: CreateTemplateDto,
        tenantId: string,
    ) {
        // Generate unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        const fileName = `${uniqueSuffix}${ext}`;
        const filePath = path.join(this.templatesDir, tenantId, fileName);

        // Ensure tenant directory exists
        const tenantDir = path.join(this.templatesDir, tenantId);
        if (!fs.existsSync(tenantDir)) {
            fs.mkdirSync(tenantDir, { recursive: true });
        }

        // Save file
        fs.writeFileSync(filePath, file.buffer);

        // Create template record
        const template = await this.prisma.documentTemplate.create({
            data: {
                name: dto.name,
                description: dto.description,
                category: dto.category,
                filePath,
                fileSize: file.size,
                mimeType: file.mimetype,
                tenantId,
            },
        });

        return {
            data: template,
            message: 'تم إنشاء القالب بنجاح',
        };
    }

    /**
     * Get all templates for a tenant
     */
    async findAll(tenantId: string, category?: DocumentType) {
        const templates = await this.prisma.documentTemplate.findMany({
            where: {
                tenantId,
                isActive: true,
                ...(category && { category }),
            },
            orderBy: { name: 'asc' },
        });

        return { data: templates };
    }

    /**
     * Get a specific template
     */
    async findOne(id: string, tenantId: string) {
        const template = await this.prisma.documentTemplate.findFirst({
            where: { id, tenantId, isActive: true },
        });

        if (!template) {
            throw new NotFoundException('القالب غير موجود');
        }

        return template;
    }

    /**
     * Update a template
     */
    async update(
        id: string,
        dto: Partial<CreateTemplateDto>,
        tenantId: string,
    ) {
        const template = await this.findOne(id, tenantId);

        const updated = await this.prisma.documentTemplate.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                category: dto.category,
            },
        });

        return {
            data: updated,
            message: 'تم تحديث القالب بنجاح',
        };
    }

    /**
     * Delete a template (soft delete)
     */
    async delete(id: string, tenantId: string) {
        const template = await this.findOne(id, tenantId);

        // Soft delete by marking as inactive
        await this.prisma.documentTemplate.update({
            where: { id },
            data: { isActive: false },
        });

        return { message: 'تم حذف القالب بنجاح' };
    }

    /**
     * Hard delete a template (remove file and record)
     */
    async hardDelete(id: string, tenantId: string) {
        const template = await this.prisma.documentTemplate.findFirst({
            where: { id, tenantId },
        });

        if (!template) {
            throw new NotFoundException('القالب غير موجود');
        }

        // Delete file
        try {
            if (fs.existsSync(template.filePath)) {
                fs.unlinkSync(template.filePath);
            }
        } catch (error) {
            console.error('Failed to delete template file:', error);
        }

        // Delete record
        await this.prisma.documentTemplate.delete({
            where: { id },
        });

        return { message: 'تم حذف القالب نهائياً' };
    }

    /**
     * Get template file for download
     */
    async getFile(id: string, tenantId: string, res: any) {
        const template = await this.findOne(id, tenantId);

        if (!fs.existsSync(template.filePath)) {
            throw new NotFoundException('ملف القالب غير موجود');
        }

        res.setHeader('Content-Type', template.mimeType);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename*=UTF-8''${encodeURIComponent(template.name)}`,
        );
        res.setHeader('Content-Length', template.fileSize);

        const fileStream = fs.createReadStream(template.filePath);
        fileStream.pipe(res);
    }

    /**
     * Create document from template
     */
    async createDocumentFromTemplate(
        templateId: string,
        caseId: string | undefined,
        tenantId: string,
        userId: string,
    ) {
        const template = await this.findOne(templateId, tenantId);

        // Copy template file to documents directory
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const docDir = path.join('./uploads', tenantId, year, month);

        if (!fs.existsSync(docDir)) {
            fs.mkdirSync(docDir, { recursive: true });
        }

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(template.filePath);
        const newFileName = `${uniqueSuffix}${ext}`;
        const newFilePath = path.join(docDir, newFileName);

        // Copy file
        fs.copyFileSync(template.filePath, newFilePath);

        // Create document record
        const document = await this.prisma.document.create({
            data: {
                title: `${template.name} - نسخة`,
                description: template.description,
                fileName: template.name + ext,
                filePath: newFilePath,
                fileSize: template.fileSize,
                mimeType: template.mimeType,
                documentType: template.category,
                caseId,
                tenantId,
                uploadedById: userId,
            },
            include: {
                case: { select: { id: true, caseNumber: true, title: true } },
                uploadedBy: { select: { id: true, name: true } },
            },
        });

        return {
            data: document,
            message: 'تم إنشاء المستند من القالب بنجاح',
        };
    }
}
