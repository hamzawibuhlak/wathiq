import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFolderDto, UpdateFolderDto } from './dto/create-folder.dto';

@Injectable()
export class DocumentFoldersService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Get folders (root or by parentId)
     */
    async findAll(tenantId: string, parentId?: string) {
        const where: any = {
            tenantId,
            parentId: parentId || null,
        };

        const folders = await this.prisma.documentFolder.findMany({
            where,
            include: {
                _count: {
                    select: {
                        children: true,
                        documentLinks: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return { data: folders };
    }

    /**
     * Get folder by ID with its contents
     */
    async findOne(id: string, tenantId: string) {
        const folder = await this.prisma.documentFolder.findFirst({
            where: { id, tenantId },
            include: {
                children: {
                    include: {
                        _count: {
                            select: {
                                children: true,
                                documentLinks: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                _count: {
                    select: {
                        children: true,
                        documentLinks: true,
                    },
                },
            },
        });

        if (!folder) {
            throw new NotFoundException('المجلد غير موجود');
        }

        return { data: folder };
    }

    /**
     * Get documents in a folder
     */
    async getFolderDocuments(folderId: string, tenantId: string, page = 1, limit = 20) {
        // Verify folder exists
        const folder = await this.prisma.documentFolder.findFirst({
            where: { id: folderId, tenantId },
        });

        if (!folder) {
            throw new NotFoundException('المجلد غير موجود');
        }

        const skip = (page - 1) * limit;

        // Get documents both linked (shortcuts) AND moved (folderId) to this folder
        const [documents, total] = await Promise.all([
            this.prisma.document.findMany({
                where: {
                    tenantId,
                    OR: [
                        { folderId }, // Documents moved to this folder
                        { folderLinks: { some: { folderId, tenantId } } }, // Linked shortcuts
                    ],
                },
                include: {
                    case: { select: { id: true, caseNumber: true, title: true } },
                    uploadedBy: { select: { id: true, name: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                distinct: ['id'],
            }),
            this.prisma.document.count({
                where: {
                    tenantId,
                    OR: [
                        { folderId },
                        { folderLinks: { some: { folderId, tenantId } } },
                    ],
                },
            }),
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
     * Get breadcrumb path for a folder
     */
    async getBreadcrumb(folderId: string, tenantId: string) {
        const breadcrumb: Array<{ id: string; name: string }> = [];
        let currentId: string | null = folderId;

        while (currentId) {
            const folder: { id: string; name: string; parentId: string | null } | null = await this.prisma.documentFolder.findFirst({
                where: { id: currentId, tenantId },
                select: { id: true, name: true, parentId: true },
            });

            if (!folder) break;

            breadcrumb.unshift({ id: folder.id, name: folder.name });
            currentId = folder.parentId;
        }

        return { data: breadcrumb };
    }

    /**
     * Create a new folder
     */
    async create(dto: CreateFolderDto, tenantId: string, userId?: string) {
        // If parentId provided, verify it exists
        if (dto.parentId) {
            const parent = await this.prisma.documentFolder.findFirst({
                where: { id: dto.parentId, tenantId },
            });
            if (!parent) {
                throw new NotFoundException('المجلد الأب غير موجود');
            }
        }

        const folder = await this.prisma.documentFolder.create({
            data: {
                name: dto.name,
                color: dto.color || '#6366f1',
                icon: dto.icon || 'folder',
                parentId: dto.parentId || null,
                tenantId,
                createdById: userId || null,
            },
            include: {
                _count: {
                    select: {
                        children: true,
                        documentLinks: true,
                    },
                },
            },
        });

        return { data: folder, message: 'تم إنشاء المجلد بنجاح' };
    }

    /**
     * Create a folder for a client (auto)
     */
    async createClientFolder(clientName: string, clientId: string, tenantId: string, userId?: string) {
        const folder = await this.prisma.documentFolder.create({
            data: {
                name: clientName,
                color: '#10b981',
                icon: 'user',
                clientId,
                tenantId,
                createdById: userId || null,
            },
        });

        return folder;
    }

    /**
     * Update folder
     */
    async update(id: string, dto: UpdateFolderDto, tenantId: string) {
        const folder = await this.prisma.documentFolder.findFirst({
            where: { id, tenantId },
        });

        if (!folder) {
            throw new NotFoundException('المجلد غير موجود');
        }

        // If moving to a new parent, verify no circular reference
        if (dto.parentId) {
            if (dto.parentId === id) {
                throw new ConflictException('لا يمكن نقل المجلد إلى نفسه');
            }
            // Check that parentId is not a child of this folder
            const isChild = await this.isDescendant(dto.parentId, id, tenantId);
            if (isChild) {
                throw new ConflictException('لا يمكن نقل المجلد إلى أحد مجلداته الفرعية');
            }
        }

        const updated = await this.prisma.documentFolder.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.color !== undefined && { color: dto.color }),
                ...(dto.icon !== undefined && { icon: dto.icon }),
                ...(dto.parentId !== undefined && { parentId: dto.parentId }),
            },
            include: {
                _count: {
                    select: {
                        children: true,
                        documentLinks: true,
                    },
                },
            },
        });

        return { data: updated, message: 'تم تحديث المجلد بنجاح' };
    }

    /**
     * Delete folder (cascade deletes children and links)
     */
    async remove(id: string, tenantId: string) {
        const folder = await this.prisma.documentFolder.findFirst({
            where: { id, tenantId },
        });

        if (!folder) {
            throw new NotFoundException('المجلد غير موجود');
        }

        await this.prisma.documentFolder.delete({ where: { id } });

        return { message: 'تم حذف المجلد بنجاح' };
    }

    /**
     * Link a document to a folder
     */
    async linkDocument(folderId: string, documentId: string, tenantId: string) {
        // Verify folder exists
        const folder = await this.prisma.documentFolder.findFirst({
            where: { id: folderId, tenantId },
        });
        if (!folder) {
            throw new NotFoundException('المجلد غير موجود');
        }

        // Verify document exists
        const document = await this.prisma.document.findFirst({
            where: { id: documentId, tenantId },
        });
        if (!document) {
            throw new NotFoundException('المستند غير موجود');
        }

        // Check if already linked
        const existing = await this.prisma.documentFolderLink.findUnique({
            where: { documentId_folderId: { documentId, folderId } },
        });
        if (existing) {
            throw new ConflictException('المستند مرتبط بالمجلد بالفعل');
        }

        const link = await this.prisma.documentFolderLink.create({
            data: {
                documentId,
                folderId,
                tenantId,
            },
            include: {
                document: {
                    include: {
                        uploadedBy: { select: { id: true, name: true } },
                    },
                },
            },
        });

        return { data: link, message: 'تم نسخ المستند للمجلد بنجاح' };
    }

    /**
     * Move a document to a folder (sets document.folderId)
     * Document will disappear from root documents list
     */
    async moveDocument(folderId: string, documentId: string, tenantId: string) {
        // Verify folder exists
        const folder = await this.prisma.documentFolder.findFirst({
            where: { id: folderId, tenantId },
        });
        if (!folder) {
            throw new NotFoundException('المجلد غير موجود');
        }

        // Verify document exists
        const document = await this.prisma.document.findFirst({
            where: { id: documentId, tenantId },
        });
        if (!document) {
            throw new NotFoundException('المستند غير موجود');
        }

        // Update document's primary folder
        const updated = await this.prisma.document.update({
            where: { id: documentId },
            data: { folderId },
            include: {
                uploadedBy: { select: { id: true, name: true } },
            },
        });

        return { data: updated, message: 'تم نقل المستند للمجلد بنجاح' };
    }

    /**
     * Unlink a document from a folder
     */
    async unlinkDocument(folderId: string, documentId: string, tenantId: string) {
        const link = await this.prisma.documentFolderLink.findFirst({
            where: { folderId, documentId, tenantId },
        });

        if (!link) {
            throw new NotFoundException('الربط غير موجود');
        }

        await this.prisma.documentFolderLink.delete({ where: { id: link.id } });

        return { message: 'تم إزالة نسخة المستند من المجلد بنجاح' };
    }

    /**
     * Move document back to root (set folderId = null)
     */
    async moveToRoot(documentId: string, tenantId: string) {
        const document = await this.prisma.document.findFirst({
            where: { id: documentId, tenantId },
        });
        if (!document) {
            throw new NotFoundException('المستند غير موجود');
        }

        const updated = await this.prisma.document.update({
            where: { id: documentId },
            data: { folderId: null },
            include: {
                uploadedBy: { select: { id: true, name: true } },
            },
        });

        return { data: updated, message: 'تم نقل المستند للمجلد الأساسي بنجاح' };
    }

    /**
     * Check if targetId is a descendant of ancestorId
     */
    private async isDescendant(targetId: string, ancestorId: string, tenantId: string): Promise<boolean> {
        let currentId: string | null = targetId;
        const visited = new Set<string>();

        while (currentId) {
            if (currentId === ancestorId) return true;
            if (visited.has(currentId)) return false;
            visited.add(currentId);

            const folder: { parentId: string | null } | null = await this.prisma.documentFolder.findFirst({
                where: { id: currentId, tenantId },
                select: { parentId: true },
            });

            currentId = folder?.parentId || null;
        }

        return false;
    }
}
