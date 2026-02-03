import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Prisma, DocumentType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface DocumentFilters {
    caseId?: string;
    documentType?: string;
}

@Injectable()
export class DocumentsService {
    private readonly uploadDir = './uploads';

    constructor(private readonly prisma: PrismaService) {
        // Ensure base upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Get all documents with filters
     * Lawyers only see documents from cases assigned to them
     */
    async findAll(
        tenantId: string,
        filters: DocumentFilters,
        userId?: string,
        userRole?: string,
    ) {
        const where: Prisma.DocumentWhereInput = { tenantId };

        if (filters.caseId) {
            where.caseId = filters.caseId;
        }

        if (filters.documentType) {
            where.documentType = filters.documentType as DocumentType;
        }

        // Lawyers only see documents from their assigned cases
        if (userRole === 'LAWYER' && userId) {
            where.case = {
                assignedToId: userId,
            };
        }

        const documents = await this.prisma.document.findMany({
            where,
            include: {
                case: { select: { id: true, caseNumber: true, title: true, assignedToId: true } },
                uploadedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return { data: documents };
    }

    /**
     * Get document by ID
     */
    async findOne(id: string, tenantId: string) {
        const document = await this.prisma.document.findFirst({
            where: { id, tenantId },
            include: {
                case: { select: { id: true, caseNumber: true, title: true } },
                uploadedBy: { select: { id: true, name: true } },
            },
        });

        if (!document) {
            throw new NotFoundException('المستند غير موجود');
        }

        return { data: document };
    }

    /**
     * Serve document file (with tenant validation)
     */
    async serveFile(id: string, tenantId: string, res: Response, disposition: 'inline' | 'attachment' = 'inline') {
        const document = await this.findOne(id, tenantId);
        return this.streamFile(document.data, res, disposition);
    }

    /**
     * Serve document file publicly (no tenant validation)
     * Used for preview in img/iframe which can't send auth headers
     * Document ID acts as access token
     */
    async serveFilePublic(id: string, res: Response, disposition: 'inline' | 'attachment' = 'inline') {
        const document = await this.prisma.document.findUnique({
            where: { id },
            select: {
                id: true,
                fileName: true,
                filePath: true,
                fileSize: true,
                mimeType: true,
            },
        });

        if (!document) {
            throw new NotFoundException('المستند غير موجود');
        }

        return this.streamFile(document, res, disposition);
    }

    /**
     * Common method to stream file to response
     */
    private streamFile(
        document: { fileName: string; filePath: string; fileSize: number; mimeType: string | null },
        res: Response,
        disposition: 'inline' | 'attachment',
    ) {
        const filePath = document.filePath;

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('ملف المستند غير موجود');
        }

        // Determine content type
        const mimeType = document.mimeType || 'application/octet-stream';

        // Set proper headers
        res.setHeader('Content-Type', mimeType);

        // Encode filename for Content-Disposition (handles Arabic filenames)
        const encodedFilename = encodeURIComponent(document.fileName);
        res.setHeader(
            'Content-Disposition',
            `${disposition}; filename*=UTF-8''${encodedFilename}`,
        );
        res.setHeader('Content-Length', document.fileSize);

        // Cache for images and PDFs (preview), no cache for downloads
        if (disposition === 'inline') {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        } else {
            res.setHeader('Cache-Control', 'no-cache');
        }

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    }

    /**
     * Download document file (legacy - redirect to serveFile)
     */
    async download(id: string, tenantId: string, res: Response) {
        return this.serveFile(id, tenantId, res, 'attachment');
    }

    /**
     * Upload new document
     * Storage path: uploads/{tenantId}/{year}/{month}/filename
     */
    async upload(
        file: Express.Multer.File,
        dto: CreateDocumentDto,
        tenantId: string,
        userId: string,
    ) {
        if (!file) {
            throw new BadRequestException('الملف مطلوب');
        }

        // Verify case exists and belongs to tenant
        if (dto.caseId) {
            const caseExists = await this.prisma.case.findFirst({
                where: { id: dto.caseId, tenantId },
            });

            if (!caseExists) {
                throw new NotFoundException('القضية غير موجودة');
            }
        }

        // Generate storage path: uploads/{tenantId}/{year}/{month}/
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const tenantDir = path.join(this.uploadDir, tenantId, year, month);

        // Ensure directory exists
        if (!fs.existsSync(tenantDir)) {
            fs.mkdirSync(tenantDir, { recursive: true });
        }

        // Generate unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        const fileName = `${uniqueSuffix}${ext}`;
        const filePath = path.join(tenantDir, fileName);

        try {
            // Save file to disk
            fs.writeFileSync(filePath, file.buffer);

            // Save metadata to database
            const document = await this.prisma.document.create({
                data: {
                    title: dto.title,
                    description: dto.description,
                    fileName: file.originalname,
                    filePath,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    documentType: dto.documentType,
                    caseId: dto.caseId,
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
                message: 'تم رفع المستند بنجاح',
            };
        } catch (error) {
            // Cleanup file if database save fails
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw new InternalServerErrorException('فشل في حفظ المستند');
        }
    }

    /**
     * Delete document
     */
    async remove(id: string, tenantId: string) {
        const document = await this.findOne(id, tenantId);

        // Delete file from disk
        try {
            if (fs.existsSync(document.data.filePath)) {
                fs.unlinkSync(document.data.filePath);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }

        // Delete from database
        await this.prisma.document.delete({ where: { id } });

        return { message: 'تم حذف المستند بنجاح' };
    }
}
