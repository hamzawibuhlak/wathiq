import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EntityCodeService } from '../common/services/entity-code.service';
import { DocumentFoldersService } from '../document-folders/document-folders.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterClientsDto } from './dto/filter-clients.dto';
import { Prisma } from '@prisma/client';

// Response interfaces
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

@Injectable()
export class ClientsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly entityCodeService: EntityCodeService,
        private readonly documentFoldersService: DocumentFoldersService,
    ) { }

    /**
     * Get all clients with pagination and search
     * Lawyers only see clients they are assigned to via visibleToUsers
     */
    async findAll(
        tenantId: string,
        filterDto: FilterClientsDto,
        userId?: string,
        userRole?: string,
    ): Promise<PaginatedResponse<unknown>> {
        const {
            page = 1,
            limit = 10,
            search,
            isActive,
            city,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filterDto;

        // Build where clause - ALWAYS filter by tenantId
        const where: Prisma.ClientWhereInput = { tenantId };

        // Lawyers only see clients assigned to them
        if (userRole === 'LAWYER' && userId) {
            where.visibleToUsers = {
                some: { id: userId },
            };
        }

        // Active filter
        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // City filter
        if (city) {
            where.city = { contains: city, mode: 'insensitive' };
        }

        // Search in name, phone, email, nationalId, companyName
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { nationalId: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Calculate skip
        const skip = (page - 1) * limit;

        // Build orderBy
        const orderBy: Prisma.ClientOrderByWithRelationInput = {};
        const validSortFields = ['createdAt', 'updatedAt', 'name'];
        if (validSortFields.includes(sortBy)) {
            orderBy[sortBy as keyof Prisma.ClientOrderByWithRelationInput] = sortOrder;
        } else {
            orderBy.createdAt = 'desc';
        }

        // Execute queries in parallel
        const [clients, total] = await Promise.all([
            this.prisma.client.findMany({
                where,
                include: {
                    _count: { select: { cases: true } },
                    visibleToUsers: { select: { id: true, name: true } },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.client.count({ where }),
        ]);

        return {
            data: clients,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get client by ID with cases, hearings, invoices
     */
    async findOne(id: string, tenantId: string, userId?: string, userRole?: string) {
        const where: Prisma.ClientWhereInput = { id, tenantId };

        // Lawyers can only view clients assigned to them
        if (userRole === 'LAWYER' && userId) {
            where.visibleToUsers = {
                some: { id: userId },
            };
        }

        const client = await this.prisma.client.findFirst({
            where,
            include: {
                cases: {
                    select: {
                        id: true,
                        caseNumber: true,
                        title: true,
                        status: true,
                        caseType: true,
                        createdAt: true,
                        assignedTo: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                hearings: {
                    select: {
                        id: true,
                        hearingDate: true,
                        courtName: true,
                        courtroom: true,
                        status: true,
                        case: {
                            select: {
                                id: true,
                                caseNumber: true,
                                title: true,
                            },
                        },
                    },
                    orderBy: { hearingDate: 'desc' },
                    take: 10,
                },
                invoices: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        amount: true,
                        status: true,
                        dueDate: true,
                        createdAt: true,
                        case: {
                            select: {
                                id: true,
                                caseNumber: true,
                                title: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                visibleToUsers: { select: { id: true, name: true } },
                _count: {
                    select: {
                        cases: true,
                        hearings: true,
                        invoices: true,
                    },
                },
            },
        });

        if (!client) {
            throw new NotFoundException('العميل غير موجود');
        }

        return { data: client };
    }

    /**
     * Get client's cases
     */
    async getClientCases(clientId: string, tenantId: string) {
        // Verify client exists
        await this.findOne(clientId, tenantId);

        const cases = await this.prisma.case.findMany({
            where: { clientId, tenantId },
            include: {
                assignedTo: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return { data: cases };
    }

    /**
     * Create new client
     */
    async create(dto: CreateClientDto, tenantId: string, userId?: string) {
        const { visibleToUserIds, ...clientData } = dto;

        // Phase 37: Generate client code
        const clientCode = await this.entityCodeService.generateClientCode(tenantId);

        const client = await this.prisma.client.create({
            data: {
                ...clientData,
                tenantId,
                code: clientCode.code,
                codeNumber: clientCode.codeNumber,
                visibleToUsers: visibleToUserIds?.length
                    ? { connect: visibleToUserIds.map((id) => ({ id })) }
                    : undefined,
            } as any,
            include: {
                _count: { select: { cases: true } },
                visibleToUsers: { select: { id: true, name: true } },
            },
        });

        // ─── إنشاء مجلد باسم العميل تلقائياً ────────────
        try {
            await this.documentFoldersService.createClientFolder(
                dto.name,
                client.id,
                tenantId,
                userId,
            );
        } catch {
            // لا نوقف إنشاء العميل إذا فشل إنشاء المجلد
        }

        // ─── إنشاء سجلات Document لكل مستند مرفق مع العميل ────────────
        if (userId) {
            const docFields: Array<{ url: string | undefined; title: string; docType: string }> = [
                { url: dto.nationalIdDoc, title: 'مستند الهوية الوطنية', docType: 'IDENTITY' },
                { url: dto.commercialRegDoc, title: 'مستند السجل التجاري', docType: 'CONTRACT' },
                { url: dto.nationalAddressDoc, title: 'العنوان الوطني', docType: 'OTHER' },
                { url: dto.repIdentityDoc, title: 'هوية ممثل الشركة', docType: 'IDENTITY' },
                { url: dto.repDoc, title: 'مستند تمثيل الشركة', docType: 'CONTRACT' },
            ];

            for (const docField of docFields) {
                if (!docField.url) continue;

                // Extract file path from URL: /uploads/filename.ext -> ./uploads/filename.ext
                const filePath = `.${docField.url}`;
                const fileName = docField.url.split('/').pop() || 'document';
                const ext = fileName.split('.').pop()?.toLowerCase() || '';
                const mimeMap: Record<string, string> = {
                    pdf: 'application/pdf',
                    jpg: 'image/jpeg',
                    jpeg: 'image/jpeg',
                    png: 'image/png',
                    webp: 'image/webp',
                };
                const mimeType = mimeMap[ext] || 'application/octet-stream';

                try {
                    const docCode = await this.entityCodeService.generateFlatCode(tenantId, 'document');
                    await (this.prisma as any).document.create({
                        data: {
                            title: `${docField.title} — ${dto.name}`,
                            fileName,
                            filePath,
                            fileSize: 0,
                            mimeType,
                            documentType: docField.docType,
                            tags: ['عميل', dto.name],
                            ocrStatus: mimeType === 'application/pdf' || mimeType.startsWith('image/') ? 'PENDING' : 'NOT_APPLICABLE',
                            tenantId,
                            uploadedById: userId,
                            code: docCode.code,
                            codeNumber: docCode.codeNumber,
                        },
                    });
                } catch {
                    // لا نوقف إنشاء العميل إذا فشل إنشاء سجل المستند
                }
            }
        }

        return {
            data: client,
            message: 'تم إنشاء العميل بنجاح',
        };
    }

    /**
     * Update client
     */
    async update(id: string, dto: UpdateClientDto, tenantId: string) {
        // Verify client exists
        await this.findOne(id, tenantId);

        const { visibleToUserIds, ...clientData } = dto;

        const client = await this.prisma.client.update({
            where: { id },
            data: {
                ...clientData,
                visibleToUsers: visibleToUserIds !== undefined
                    ? { set: visibleToUserIds.map((id) => ({ id })) }
                    : undefined,
            },
            include: {
                _count: { select: { cases: true } },
                visibleToUsers: { select: { id: true, name: true } },
            },
        });

        return {
            data: client,
            message: 'تم تحديث العميل بنجاح',
        };
    }

    /**
     * Delete client
     */
    async remove(id: string, tenantId: string) {
        // Verify client exists
        const client = await this.findOne(id, tenantId);

        // Check if client has cases
        if (client.data._count.cases > 0) {
            throw new NotFoundException('لا يمكن حذف عميل لديه قضايا مرتبطة');
        }

        await this.prisma.client.delete({ where: { id } });

        return { message: 'تم حذف العميل بنجاح' };
    }
}
