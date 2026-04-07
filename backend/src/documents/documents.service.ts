import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../common/prisma/prisma.service';
import { EntityCodeService } from '../common/services/entity-code.service';
import { CreateDocumentDto, UpdateDocumentDto, FilterDocumentsDto } from './dto/create-document.dto';
import { Prisma, DocumentType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
    private readonly uploadDir = './uploads';

    constructor(
        private readonly prisma: PrismaService,
        private readonly entityCodeService: EntityCodeService,
    ) {
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
        filters: FilterDocumentsDto,
        userId?: string,
        userRole?: string,
    ) {
        const {
            page = 1,
            limit = 20,
            search,
            caseId,
            documentType,
            tags,
            fromDate,
            toDate,
            onlyLatest = true,
        } = filters;

        const skip = (page - 1) * limit;

        // Build AND conditions to avoid OR conflicts
        const andConditions: Prisma.DocumentWhereInput[] = [];

        if (caseId) {
            andConditions.push({
                OR: [
                    { caseId },
                    { caseIds: { has: caseId } } as any,
                ],
            });
        }

        if (search) {
            andConditions.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { fileName: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { ocrText: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        const where: Prisma.DocumentWhereInput = {
            tenantId,
            folderId: null, // Only show documents NOT moved to a folder
            ...(onlyLatest && { isLatest: true }),
            ...(documentType && { documentType: documentType as DocumentType }),
            ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
            ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
            ...(toDate && { createdAt: { lte: new Date(toDate) } }),
            ...(andConditions.length > 0 && { AND: andConditions }),
        };

        // Lawyers only see documents from their assigned cases
        if (userRole === 'LAWYER' && userId) {
            where.case = {
                assignedToId: userId,
            };
        }

        const [documents, total] = await Promise.all([
            this.prisma.document.findMany({
                where,
                skip,
                take: limit,
                include: {
                    case: { select: { id: true, caseNumber: true, title: true, assignedToId: true } },
                    uploadedBy: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.document.count({ where }),
        ]);

        return {
            data: documents,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
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

        return document;
    }

    /**
     * Serve document file (with tenant validation)
     */
    async serveFile(id: string, tenantId: string, res: Response, disposition: 'inline' | 'attachment' = 'inline') {
        const document = await this.findOne(id, tenantId);
        return this.streamFile(document, res, disposition);
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

        // Determine initial OCR status
        let ocrStatus = 'NOT_APPLICABLE';
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            ocrStatus = 'PENDING';
        }

        try {
            // Save file to disk
            fs.writeFileSync(filePath, file.buffer);

            // Parse tags if provided as string
            let tags: string[] = [];
            if (dto.tags) {
                if (typeof dto.tags === 'string') {
                    try {
                        tags = JSON.parse(dto.tags);
                    } catch {
                        tags = (dto.tags as string).split(',').map(t => t.trim());
                    }
                } else if (Array.isArray(dto.tags)) {
                    tags = dto.tags;
                }
            }

            // Parse caseIds if provided
            let caseIds: string[] = [];
            if (dto.caseIds) {
                if (typeof dto.caseIds === 'string') {
                    try {
                        caseIds = JSON.parse(dto.caseIds);
                    } catch {
                        caseIds = (dto.caseIds as string).split(',').map(t => t.trim()).filter(Boolean);
                    }
                } else if (Array.isArray(dto.caseIds)) {
                    caseIds = dto.caseIds;
                }
            }

            // If caseIds provided but no caseId, set caseId to first one (backward compat)
            const primaryCaseId = dto.caseId || (caseIds.length > 0 ? caseIds[0] : undefined);

            // Phase 37: Generate flat document code
            const docCode = await this.entityCodeService.generateFlatCode(tenantId, 'document');

            // Save metadata to database
            const document = await this.prisma.document.create({
                data: {
                    title: dto.title || file.originalname,
                    description: dto.description,
                    fileName: file.originalname,
                    filePath,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    documentType: dto.documentType || DocumentType.OTHER,
                    tags,
                    ocrStatus,
                    caseId: primaryCaseId,
                    caseIds,
                    tenantId,
                    uploadedById: userId,
                    code: docCode.code,
                    codeNumber: docCode.codeNumber,
                } as any,
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
            console.error('Document upload error:', error);
            throw new InternalServerErrorException('فشل في حفظ المستند: ' + (error?.message || error));
        }
    }

    /**
     * Create a new version of a document
     */
    async createNewVersion(
        documentId: string,
        file: Express.Multer.File,
        tenantId: string,
        userId: string,
    ) {
        // Get the current latest version
        const currentDoc = await this.prisma.document.findFirst({
            where: { id: documentId, tenantId, isLatest: true },
        });

        if (!currentDoc) {
            throw new NotFoundException('المستند غير موجود');
        }

        // Mark current version as not latest
        await this.prisma.document.update({
            where: { id: documentId },
            data: { isLatest: false },
        });

        // Generate storage path
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const tenantDir = path.join(this.uploadDir, tenantId, year, month);

        if (!fs.existsSync(tenantDir)) {
            fs.mkdirSync(tenantDir, { recursive: true });
        }

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        const fileName = `${uniqueSuffix}${ext}`;
        const filePath = path.join(tenantDir, fileName);

        // Determine initial OCR status
        let ocrStatus = 'NOT_APPLICABLE';
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            ocrStatus = 'PENDING';
        }

        try {
            fs.writeFileSync(filePath, file.buffer);

            // Create new version
            const newVersion = await this.prisma.document.create({
                data: {
                    title: currentDoc.title,
                    description: currentDoc.description,
                    fileName: file.originalname,
                    filePath,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    documentType: currentDoc.documentType,
                    tags: currentDoc.tags,
                    version: currentDoc.version + 1,
                    isLatest: true,
                    parentId: documentId,
                    ocrStatus,
                    caseId: currentDoc.caseId,
                    tenantId,
                    uploadedById: userId,
                },
                include: {
                    uploadedBy: { select: { id: true, name: true } },
                    case: { select: { id: true, caseNumber: true, title: true } },
                },
            });

            return {
                data: newVersion,
                message: `تم إنشاء الإصدار ${newVersion.version} بنجاح`,
            };
        } catch (error) {
            // Rollback: mark original as latest again
            await this.prisma.document.update({
                where: { id: documentId },
                data: { isLatest: true },
            });

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw new InternalServerErrorException('فشل في إنشاء إصدار جديد');
        }
    }

    /**
     * Get version history for a document
     */
    async getVersionHistory(documentId: string, tenantId: string) {
        const document = await this.prisma.document.findFirst({
            where: { id: documentId, tenantId },
        });

        if (!document) {
            throw new NotFoundException('المستند غير موجود');
        }

        // Get the root document ID (either this doc or its parent)
        const rootId = document.parentId || documentId;

        // Get all versions (parent and children)
        const versions = await this.prisma.document.findMany({
            where: {
                OR: [
                    { id: rootId },
                    { parentId: rootId },
                ],
                tenantId,
            },
            include: {
                uploadedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { version: 'desc' },
        });

        return { data: versions };
    }

    /**
     * Restore a previous version as the latest
     */
    async restoreVersion(versionId: string, tenantId: string) {
        const version = await this.prisma.document.findFirst({
            where: { id: versionId, tenantId },
        });

        if (!version) {
            throw new NotFoundException('الإصدار غير موجود');
        }

        // Get root document ID
        const rootId = version.parentId || versionId;

        // Mark all versions as not latest
        await this.prisma.document.updateMany({
            where: {
                OR: [
                    { id: rootId },
                    { parentId: rootId },
                ],
                tenantId,
            },
            data: { isLatest: false },
        });

        // Mark this version as latest
        const restored = await this.prisma.document.update({
            where: { id: versionId },
            data: { isLatest: true },
            include: {
                uploadedBy: { select: { id: true, name: true } },
                case: { select: { id: true, caseNumber: true, title: true } },
            },
        });

        return {
            data: restored,
            message: `تم استعادة الإصدار ${restored.version} بنجاح`,
        };
    }

    /**
     * Update document metadata
     */
    async update(id: string, dto: UpdateDocumentDto, tenantId: string) {
        const document = await this.prisma.document.findFirst({
            where: { id, tenantId, isLatest: true },
        });

        if (!document) {
            throw new NotFoundException('المستند غير موجود');
        }

        // Parse tags if provided as string
        let parsedTags: string[] | undefined = undefined;
        if (dto.tags) {
            if (typeof dto.tags === 'string') {
                try {
                    parsedTags = JSON.parse(dto.tags);
                } catch {
                    parsedTags = (dto.tags as string).split(',').map(t => t.trim());
                }
            } else if (Array.isArray(dto.tags)) {
                parsedTags = dto.tags;
            }
        }

        const updated = await this.prisma.document.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                documentType: dto.documentType,
                ...(parsedTags && { tags: parsedTags }),
            },
            include: {
                uploadedBy: { select: { id: true, name: true } },
                case: { select: { id: true, caseNumber: true, title: true } },
            },
        });

        return { data: updated, message: 'تم تحديث المستند بنجاح' };
    }

    /**
     * Delete document and all its versions
     */
    async remove(id: string, tenantId: string) {
        const document = await this.findOne(id, tenantId);

        // Get root document ID
        const rootId = document.parentId || id;

        // Get all versions
        const versions = await this.prisma.document.findMany({
            where: {
                OR: [
                    { id: rootId },
                    { parentId: rootId },
                ],
                tenantId,
            },
        });

        // Delete all files
        for (const ver of versions) {
            try {
                if (fs.existsSync(ver.filePath)) {
                    fs.unlinkSync(ver.filePath);
                }
            } catch (error) {
                console.error(`Error deleting file ${ver.filePath}:`, error);
            }
        }

        // Delete from database
        await this.prisma.document.deleteMany({
            where: {
                OR: [
                    { id: rootId },
                    { parentId: rootId },
                ],
                tenantId,
            },
        });

        return { message: 'تم حذف المستند وجميع إصداراته بنجاح' };
    }

    /**
     * Bulk delete documents
     */
    async bulkDelete(ids: string[], tenantId: string) {
        const documents = await this.prisma.document.findMany({
            where: {
                id: { in: ids },
                tenantId,
            },
        });

        if (documents.length === 0) {
            throw new NotFoundException('لم يتم العثور على مستندات');
        }

        // Delete files
        for (const doc of documents) {
            try {
                if (fs.existsSync(doc.filePath)) {
                    fs.unlinkSync(doc.filePath);
                }
            } catch (error) {
                console.error(`Failed to delete file ${doc.filePath}:`, error);
            }
        }

        // Delete from database
        const result = await this.prisma.document.deleteMany({
            where: {
                id: { in: ids },
                tenantId,
            },
        });

        return { deleted: result.count, message: `تم حذف ${result.count} مستندات` };
    }

    /**
     * Get document statistics
     */
    async getStats(tenantId: string) {
        const [total, byType, totalSize, recentUploads, ocrStats] = await Promise.all([
            this.prisma.document.count({ where: { tenantId, isLatest: true } }),
            this.prisma.document.groupBy({
                by: ['documentType'],
                where: { tenantId, isLatest: true },
                _count: true,
            }),
            this.prisma.document.aggregate({
                where: { tenantId, isLatest: true },
                _sum: { fileSize: true },
            }),
            this.prisma.document.count({
                where: {
                    tenantId,
                    isLatest: true,
                    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.document.groupBy({
                by: ['ocrStatus'],
                where: { tenantId, isLatest: true },
                _count: true,
            }),
        ]);

        return {
            data: {
                total,
                byType: byType.map((t) => ({
                    type: t.documentType,
                    count: t._count,
                })),
                totalSize: totalSize._sum.fileSize || 0,
                recentUploads,
                ocrStats: ocrStats.map((s) => ({
                    status: s.ocrStatus,
                    count: s._count,
                })),
            },
        };
    }
}
