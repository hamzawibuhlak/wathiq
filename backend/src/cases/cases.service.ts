import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EntityCodeService } from '../common/services/entity-code.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { FilterCasesDto } from './dto/filter-cases.dto';
import { Prisma, CaseStatus, UserRole } from '@prisma/client';

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

export interface CaseStats {
    total: number;
    active: number;
    closed: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
}

@Injectable()
export class CasesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
        private readonly entityCodeService: EntityCodeService,
    ) { }

    /**
     * Get all cases with pagination, search, and filters
     * LAWYER role only sees cases assigned to them
     */
    async findAll(
        tenantId: string,
        filterDto: FilterCasesDto,
        userId?: string,
        userRole?: UserRole,
    ): Promise<PaginatedResponse<unknown>> {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            caseType,
            clientId,
            assignedToId,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filterDto;

        // Build where clause - ALWAYS filter by tenantId for multi-tenancy
        const andConditions: Prisma.CaseWhereInput[] = [];

        // LAWYER can only see their own cases (assigned via assignedToId or assignedToIds)
        if (userRole === UserRole.LAWYER && userId) {
            andConditions.push({
                OR: [
                    { assignedToId: userId },
                    { assignedToIds: { has: userId } } as any,
                ],
            });
        } else if (assignedToId) {
            // For OWNER/ADMIN, allow filter by assignedToId
            andConditions.push({
                OR: [
                    { assignedToId: assignedToId },
                    { assignedToIds: { has: assignedToId } } as any,
                ],
            });
        }

        // Search in title, description, and caseNumber
        if (search) {
            andConditions.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { caseNumber: { contains: search, mode: 'insensitive' } },
                    { courtCaseNumber: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        const where: Prisma.CaseWhereInput = {
            tenantId,
            ...(andConditions.length > 0 && { AND: andConditions }),
        };

        // Status filter
        if (status) {
            where.status = status;
        }

        // Case type filter
        if (caseType) {
            where.caseType = caseType;
        }

        // Client filter
        if (clientId) {
            where.clientId = clientId;
        }

        // Priority filter
        if ((filterDto as any).priority) {
            (where as any).priority = (filterDto as any).priority;
        }

        // Calculate skip for pagination
        const skip = (page - 1) * limit;

        // Build orderBy
        const orderBy: Prisma.CaseOrderByWithRelationInput = {};
        const validSortFields = ['createdAt', 'updatedAt', 'caseNumber', 'title', 'status'];
        if (validSortFields.includes(sortBy)) {
            orderBy[sortBy as keyof Prisma.CaseOrderByWithRelationInput] = sortOrder;
        } else {
            orderBy.createdAt = 'desc';
        }

        // Execute queries in parallel
        const [cases, total] = await Promise.all([
            this.prisma.case.findMany({
                where,
                include: {
                    client: { select: { id: true, name: true, phone: true } },
                    assignedTo: { select: { id: true, name: true, avatar: true } },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.case.count({ where }),
        ]);

        return {
            data: cases,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get case by ID with all related data
     * LAWYER can only view their own cases
     */
    async findOne(id: string, tenantId: string, userId?: string, userRole?: UserRole) {
        const caseData = await this.prisma.case.findFirst({
            where: { id, tenantId },
            include: {
                client: true,
                assignedTo: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
                createdBy: { select: { id: true, name: true } },
                hearings: {
                    orderBy: { hearingDate: 'asc' },
                    take: 10,
                },
                documents: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                invoices: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!caseData) {
            throw new NotFoundException('القضية غير موجودة');
        }

        // LAWYER can only view their assigned cases
        if (userRole === UserRole.LAWYER && userId && caseData.assignedToId !== userId && !(caseData as any).assignedToIds?.includes(userId)) {
            throw new ForbiddenException('لا تملك صلاحية الوصول لهذه القضية');
        }

        return { data: caseData };
    }

    /**
     * Create new case with auto-generated case number
     */
    async create(dto: CreateCaseDto, tenantId: string, userId: string) {
        // Generate unique case number for this tenant
        const caseNumber = await this.generateCaseNumber(tenantId);

        // Phase 37: Generate hierarchical case code
        const caseCode = dto.clientId
            ? await this.entityCodeService.generateCaseCode(dto.clientId)
            : await this.entityCodeService.generateFlatCode(tenantId, 'case');

        // Convert date strings to proper DateTime format
        const data: any = {
            ...dto,
            caseNumber,
            tenantId,
            createdById: userId,
            code: caseCode.code,
            codeNumber: caseCode.codeNumber,
        };

        // Convert filingDate to proper DateTime if provided
        if (dto.filingDate) {
            data.filingDate = new Date(dto.filingDate);
        }

        // Convert nextHearingDate to proper DateTime if provided
        if (dto.nextHearingDate) {
            data.nextHearingDate = new Date(dto.nextHearingDate);
        }

        const caseData = await this.prisma.case.create({
            data,
            include: {
                client: { select: { id: true, name: true, phone: true } },
                assignedTo: { select: { id: true, name: true } },
            },
        });

        // Send notification to assigned lawyers (if different from creator)
        const lawyerIdsToNotify = new Set<string>();
        if (dto.assignedToId && dto.assignedToId !== userId) {
            lawyerIdsToNotify.add(dto.assignedToId);
        }
        if (dto.assignedToIds) {
            for (const lid of dto.assignedToIds) {
                if (lid !== userId) lawyerIdsToNotify.add(lid);
            }
        }
        for (const lawyerId of lawyerIdsToNotify) {
            await this.notificationsService.create({
                title: 'قضية جديدة مسندة إليك',
                message: `تم إسناد القضية "${caseData.title}" (${caseNumber}) إليك`,
                type: 'INFO',
                link: `/cases/${caseData.id}`,
                userId: lawyerId,
                tenantId,
            });
        }

        return {
            data: caseData,
            message: 'تم إنشاء القضية بنجاح',
        };
    }

    /**
     * Update case
     * LAWYER can only update their own cases
     */
    async update(
        id: string,
        dto: UpdateCaseDto,
        tenantId: string,
        userId?: string,
        userRole?: UserRole,
    ) {
        // Verify case exists and belongs to tenant
        const existingCase = await this.prisma.case.findFirst({
            where: { id, tenantId },
        });

        if (!existingCase) {
            throw new NotFoundException('القضية غير موجودة');
        }

        // LAWYER can only update their own cases
        if (userRole === UserRole.LAWYER && userId && existingCase.assignedToId !== userId && !(existingCase as any).assignedToIds?.includes(userId)) {
            throw new ForbiddenException('لا تملك صلاحية تعديل هذه القضية');
        }

        // Build update data carefully — handle date fields and assignments
        const updateData: any = { ...dto };

        // Convert filingDate string to DateTime if provided
        if (dto.filingDate) {
            updateData.filingDate = new Date(dto.filingDate);
        } else if (dto.filingDate === '' || dto.filingDate === null) {
            updateData.filingDate = null;
        }

        // Convert nextHearingDate string to DateTime if provided
        if (dto.nextHearingDate) {
            updateData.nextHearingDate = new Date(dto.nextHearingDate);
        }

        // Handle assignedToId — must be valid UUID or null (not empty string)
        if (updateData.assignedToId === '') {
            updateData.assignedToId = null;
        }

        const caseData = await this.prisma.case.update({
            where: { id },
            data: updateData,
            include: {
                client: { select: { id: true, name: true, phone: true } },
                assignedTo: { select: { id: true, name: true } },
            },
        });

        return {
            data: caseData,
            message: 'تم تحديث القضية بنجاح',
        };
    }

    /**
     * Delete case (OWNER/ADMIN only)
     */
    async remove(id: string, tenantId: string) {
        // Verify case exists and belongs to tenant
        const existingCase = await this.prisma.case.findFirst({
            where: { id, tenantId },
        });

        if (!existingCase) {
            throw new NotFoundException('القضية غير موجودة');
        }

        await this.prisma.case.delete({ where: { id } });

        return { message: 'تم حذف القضية بنجاح' };
    }

    /**
     * Get case statistics for dashboard
     * LAWYER sees stats for their cases only
     */
    async getStats(
        tenantId: string,
        userId?: string,
        userRole?: UserRole,
    ): Promise<{ data: CaseStats }> {
        // Build base where clause
        const baseWhere: Prisma.CaseWhereInput = { tenantId };

        // LAWYER only sees their own case stats
        if (userRole === UserRole.LAWYER && userId) {
            baseWhere.OR = [
                { assignedToId: userId },
                { assignedToIds: { has: userId } } as any,
            ];
        }

        // Get all counts in parallel for performance
        const [
            total,
            openCount,
            inProgressCount,
            closedCount,
            suspendedCount,
            archivedCount,
            byTypeRaw,
        ] = await Promise.all([
            // Total cases
            this.prisma.case.count({ where: baseWhere }),
            // By status
            this.prisma.case.count({ where: { ...baseWhere, status: CaseStatus.OPEN } }),
            this.prisma.case.count({ where: { ...baseWhere, status: CaseStatus.IN_PROGRESS } }),
            this.prisma.case.count({ where: { ...baseWhere, status: CaseStatus.CLOSED } }),
            this.prisma.case.count({ where: { ...baseWhere, status: CaseStatus.SUSPENDED } }),
            this.prisma.case.count({ where: { ...baseWhere, status: CaseStatus.ARCHIVED } }),
            // Group by type
            this.prisma.case.groupBy({
                by: ['caseType'],
                where: baseWhere,
                _count: { id: true },
            }),
        ]);

        // Transform byType to object
        const byType: Record<string, number> = {};
        for (const item of byTypeRaw) {
            byType[item.caseType.toLowerCase()] = item._count.id;
        }

        // Build byStatus object
        const byStatus: Record<string, number> = {
            open: openCount,
            in_progress: inProgressCount,
            closed: closedCount,
            suspended: suspendedCount,
            archived: archivedCount,
        };

        // Active = open + in_progress
        const active = openCount + inProgressCount;

        return {
            data: {
                total,
                active,
                closed: closedCount,
                byType,
                byStatus,
            },
        };
    }

    /**
     * Generate unique case number: CASE-YYYY-XXXX
     */
    private async generateCaseNumber(tenantId: string): Promise<string> {
        const year = new Date().getFullYear();

        // Count cases for this tenant in current year
        const count = await this.prisma.case.count({
            where: {
                tenantId,
                createdAt: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`),
                },
            },
        });

        // Format: CASE-2024-0001
        const number = (count + 1).toString().padStart(4, '0');
        return `CASE-${year}-${number}`;
    }

    /**
     * Bulk update status for multiple cases
     */
    async bulkUpdateStatus(ids: string[], status: string, tenantId: string) {
        // Validate status
        const validStatuses = ['OPEN', 'IN_PROGRESS', 'SUSPENDED', 'CLOSED', 'ARCHIVED'];
        if (!validStatuses.includes(status)) {
            throw new NotFoundException('حالة غير صالحة');
        }

        const result = await this.prisma.case.updateMany({
            where: {
                id: { in: ids },
                tenantId,
            },
            data: { status: status as CaseStatus },
        });

        return {
            message: `تم تحديث ${result.count} قضية بنجاح`,
            count: result.count,
        };
    }

    /**
     * Bulk delete multiple cases
     */
    async bulkDelete(ids: string[], tenantId: string) {
        const result = await this.prisma.case.deleteMany({
            where: {
                id: { in: ids },
                tenantId,
            },
        });

        return {
            message: `تم حذف ${result.count} قضية بنجاح`,
            count: result.count,
        };
    }
}
