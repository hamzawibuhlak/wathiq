import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateHearingDto } from './dto/create-hearing.dto';
import { UpdateHearingDto } from './dto/update-hearing.dto';
import { FilterHearingsDto } from './dto/filter-hearings.dto';
import { Prisma, HearingStatus, UserRole } from '@prisma/client';
import { EmailService } from '../email/email.service';

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

export interface CalendarHearing {
    id: string;
    hearingDate: Date;
    hearingTime: string | null;
    status: HearingStatus;
    courtName: string | null;
    case: {
        id: string;
        title: string;
        caseNumber: string;
        client: { name: string };
    };
}

@Injectable()
export class HearingsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) { }

    /**
     * Get all hearings with pagination and filters
     * LAWYER role can only see hearings from their assigned cases
     */
    async findAll(
        tenantId: string,
        filterDto: FilterHearingsDto,
        userId?: string,
        userRole?: UserRole,
    ): Promise<PaginatedResponse<unknown>> {
        const {
            page = 1,
            limit = 10,
            caseId,
            status,
            startDate,
            endDate,
            sortBy = 'hearingDate',
            sortOrder = 'asc',
        } = filterDto;

        // Build where clause
        const where: Prisma.HearingWhereInput = { tenantId };

        // ⚡ LAWYER role restriction: only see their assigned hearings
        if (userRole === UserRole.LAWYER && userId) {
            where.assignedToId = userId;
        }

        // Case filter
        if (caseId) {
            where.caseId = caseId;
        }

        // Status filter
        if (status) {
            where.status = status;
        }

        // Date range filter
        if (startDate || endDate) {
            where.hearingDate = {};
            if (startDate) {
                where.hearingDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.hearingDate.lte = new Date(endDate);
            }
        }

        // Calculate skip
        const skip = (page - 1) * limit;

        // Build orderBy
        const orderBy: Prisma.HearingOrderByWithRelationInput = {};
        const validSortFields = ['hearingDate', 'createdAt', 'courtName'];
        if (validSortFields.includes(sortBy)) {
            orderBy[sortBy as keyof Prisma.HearingOrderByWithRelationInput] = sortOrder;
        } else {
            orderBy.hearingDate = 'asc';
        }

        // Execute queries in parallel
        const [hearings, total] = await Promise.all([
            this.prisma.hearing.findMany({
                where,
                include: {
                    case: {
                        select: {
                            id: true,
                            title: true,
                            caseNumber: true,
                            opposingParty: true,
                            client: { select: { id: true, name: true } },
                        },
                    },
                    client: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            email: true,
                        },
                    },
                    assignedTo: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.hearing.count({ where }),
        ]);

        return {
            data: hearings,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get hearings for calendar view (entire month)
     * LAWYER role can only see hearings from their assigned cases
     */
    async getCalendar(
        tenantId: string,
        month?: number,
        year?: number,
        userId?: string,
        userRole?: UserRole,
    ) {
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const targetMonth = month || now.getMonth() + 1; // 1-indexed

        // Calculate first and last day of the month
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        // Build where clause
        const where: Prisma.HearingWhereInput = {
            tenantId,
            hearingDate: {
                gte: startDate,
                lte: endDate,
            },
        };

        // LAWYER role restriction: only see their assigned hearings
        if (userRole === UserRole.LAWYER && userId) {
            where.assignedToId = userId;
        }

        const hearings = await this.prisma.hearing.findMany({
            where,
            select: {
                id: true,
                hearingDate: true,
                status: true,
                courtName: true,
                case: {
                    select: {
                        id: true,
                        title: true,
                        caseNumber: true,
                        client: { select: { name: true } },
                    },
                },
            },
            orderBy: { hearingDate: 'asc' },
        });

        // Group by date for calendar view
        const groupedByDate: Record<string, typeof hearings> = {};
        for (const hearing of hearings) {
            const dateKey = hearing.hearingDate.toISOString().split('T')[0];
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }
            groupedByDate[dateKey].push(hearing);
        }

        return {
            data: {
                month: targetMonth,
                year: targetYear,
                hearings,
                byDate: groupedByDate,
                totalCount: hearings.length,
            },
        };
    }

    /**
     * Get upcoming hearings (next N days)
     * LAWYER role can only see hearings from their assigned cases
     */
    async getUpcoming(
        tenantId: string,
        days: number = 7,
        userId?: string,
        userRole?: UserRole,
    ) {
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + days);

        // Build where clause
        const where: Prisma.HearingWhereInput = {
            tenantId,
            hearingDate: {
                gte: now,
                lte: endDate,
            },
            status: {
                in: [HearingStatus.SCHEDULED, HearingStatus.POSTPONED],
            },
        };

        // LAWYER role restriction: only see their assigned hearings
        if (userRole === UserRole.LAWYER && userId) {
            where.assignedToId = userId;
        }

        const hearings = await this.prisma.hearing.findMany({
            where,
            include: {
                case: {
                    select: {
                        id: true,
                        title: true,
                        caseNumber: true,
                        opposingParty: true,
                        client: { select: { id: true, name: true, phone: true } },
                        assignedTo: { select: { id: true, name: true, avatar: true } },
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { hearingDate: 'asc' },
        });

        // Group by urgency
        const today = hearings.filter(h => {
            const hearingDate = new Date(h.hearingDate);
            return hearingDate.toDateString() === now.toDateString();
        });

        const tomorrow = hearings.filter(h => {
            const hearingDate = new Date(h.hearingDate);
            const tomorrowDate = new Date();
            tomorrowDate.setDate(now.getDate() + 1);
            return hearingDate.toDateString() === tomorrowDate.toDateString();
        });

        const thisWeek = hearings.filter(h => {
            const hearingDate = new Date(h.hearingDate);
            return hearingDate > new Date(now.getTime() + 24 * 60 * 60 * 1000 * 2);
        });

        return {
            data: {
                all: hearings,
                today,
                tomorrow,
                thisWeek,
                totalCount: hearings.length,
                days,
            },
        };
    }

    /**
     * Get hearing by ID
     */
    async findOne(id: string, tenantId: string) {
        const hearing = await this.prisma.hearing.findFirst({
            where: { id, tenantId },
            include: {
                case: {
                    select: {
                        id: true,
                        title: true,
                        caseNumber: true,
                        courtName: true,
                        client: { select: { id: true, name: true, phone: true } },
                        assignedTo: { select: { id: true, name: true, phone: true } },
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!hearing) {
            throw new NotFoundException('الجلسة غير موجودة');
        }

        return { data: hearing };
    }

    /**
     * Create new hearing
     */
    async create(dto: CreateHearingDto, tenantId: string, userId: string) {
        // Verify client exists if provided
        if (dto.clientId) {
            const clientExists = await this.prisma.client.findFirst({
                where: { id: dto.clientId, tenantId },
            });

            if (!clientExists) {
                throw new NotFoundException('العميل غير موجود');
            }
        }

        // Verify case exists if provided
        if (dto.caseId) {
            const caseExists = await this.prisma.case.findFirst({
                where: { id: dto.caseId, tenantId },
            });

            if (!caseExists) {
                throw new NotFoundException('القضية غير موجودة');
            }
        }

        const hearing = await this.prisma.hearing.create({
            data: {
                hearingNumber: dto.hearingNumber || '',
                hearingDate: new Date(dto.hearingDate),
                clientId: dto.clientId || null,
                caseId: dto.caseId || null,
                assignedToId: dto.assignedToId || null,
                opponentName: dto.opponentName || null,
                courtName: dto.courtName || null,
                judgeName: dto.judgeName || null,
                courtroom: dto.courtroom || null,
                status: dto.status,
                notes: dto.notes || null,
                tenantId,
                createdById: userId,
            },
            include: {
                case: {
                    select: {
                        id: true,
                        title: true,
                        caseNumber: true,
                        client: { select: { name: true } },
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return {
            data: hearing,
            message: 'تم إنشاء الجلسة بنجاح',
        };
    }

    /**
     * Update hearing
     */
    async update(id: string, dto: UpdateHearingDto, tenantId: string) {
        await this.findOne(id, tenantId);

        const updateData: Prisma.HearingUpdateInput = { ...dto };
        if (dto.hearingDate) {
            updateData.hearingDate = new Date(dto.hearingDate);
        }

        const hearing = await this.prisma.hearing.update({
            where: { id },
            data: updateData,
            include: {
                case: {
                    select: {
                        id: true,
                        title: true,
                        caseNumber: true,
                        client: { select: { name: true } },
                    },
                },
            },
        });

        return {
            data: hearing,
            message: 'تم تحديث الجلسة بنجاح',
        };
    }

    /**
     * Delete hearing
     */
    async remove(id: string, tenantId: string) {
        await this.findOne(id, tenantId);

        await this.prisma.hearing.delete({ where: { id } });

        return { message: 'تم حذف الجلسة بنجاح' };
    }

    /**
     * Send email reminder for a hearing
     */
    async sendReminder(id: string, tenantId: string) {
        const hearing = await this.prisma.hearing.findFirst({
            where: { id, tenantId },
            include: {
                case: {
                    select: {
                        title: true,
                        caseNumber: true,
                    },
                },
                client: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!hearing) {
            throw new NotFoundException('الجلسة غير موجودة');
        }

        if (!hearing.client?.email) {
            throw new BadRequestException('العميل لا يملك بريد إلكتروني');
        }

        const result = await this.emailService.sendHearingReminder({
            to: hearing.client.email,
            clientName: hearing.client.name,
            hearingDate: hearing.hearingDate,
            courtName: hearing.courtName || '',
            caseTitle: hearing.case?.title || '',
            caseNumber: hearing.case?.caseNumber || '',
        });

        if (!result.success) {
            throw new InternalServerErrorException('فشل إرسال البريد الإلكتروني: ' + result.error);
        }

        return {
            message: 'تم إرسال التذكير بنجاح',
            data: { sentTo: hearing.client.email },
        };
    }

    /**
     * Bulk update status for multiple hearings
     */
    async bulkUpdateStatus(ids: string[], status: string, tenantId: string) {
        // Validate status
        const validStatuses = ['SCHEDULED', 'COMPLETED', 'POSTPONED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            throw new NotFoundException('حالة غير صالحة');
        }

        const result = await this.prisma.hearing.updateMany({
            where: {
                id: { in: ids },
                tenantId,
            },
            data: { status: status as HearingStatus },
        });

        return {
            message: `تم تحديث ${result.count} جلسة بنجاح`,
            count: result.count,
        };
    }

    /**
     * Bulk delete multiple hearings
     */
    async bulkDelete(ids: string[], tenantId: string) {
        const result = await this.prisma.hearing.deleteMany({
            where: {
                id: { in: ids },
                tenantId,
            },
        });

        return {
            message: `تم حذف ${result.count} جلسة بنجاح`,
            count: result.count,
        };
    }
}

