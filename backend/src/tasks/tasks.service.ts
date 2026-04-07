import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EntityCodeService } from '../common/services/entity-code.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Prisma, TaskStatus, UserRole } from '@prisma/client';

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface TaskStats {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    overdue: number;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
}

@Injectable()
export class TasksService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
        private readonly entityCodeService: EntityCodeService,
    ) { }

    /**
     * Get all tasks with pagination, search, and filters
     */
    async findAll(
        tenantId: string,
        filterDto: FilterTasksDto,
        userId?: string,
        userRole?: UserRole,
    ): Promise<PaginatedResponse<unknown>> {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            priority,
            assignedToId,
            caseId,
            hearingId,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            overdue,
            rootOnly,
        } = filterDto;

        // Build where clause
        const where: Prisma.TaskWhereInput = { tenantId };

        // LAWYER can only see their own tasks
        if (userRole === UserRole.LAWYER && userId) {
            where.OR = [
                { assignedToId: userId },
                { createdById: userId },
            ];
        } else if (assignedToId) {
            where.assignedToId = assignedToId;
        }

        // Status filter
        if (status) {
            where.status = status;
        }

        // Priority filter
        if (priority) {
            where.priority = priority;
        }

        // Case filter
        if (caseId) {
            where.caseId = caseId;
        }

        // Hearing filter
        if (hearingId) {
            where.hearingId = hearingId;
        }

        // Overdue filter
        if (overdue) {
            where.dueDate = { lt: new Date() };
            where.status = { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
        }

        // Root tasks only (no parent)
        if (rootOnly) {
            where.parentId = null;
        }

        // Search in title and description
        if (search) {
            where.AND = [
                {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                    ],
                },
            ];
        }

        const skip = (page - 1) * limit;

        // Build orderBy
        const orderBy: Prisma.TaskOrderByWithRelationInput = {};
        const validSortFields = ['createdAt', 'updatedAt', 'dueDate', 'title', 'status', 'priority'];
        if (validSortFields.includes(sortBy)) {
            orderBy[sortBy as keyof Prisma.TaskOrderByWithRelationInput] = sortOrder;
        } else {
            orderBy.createdAt = 'desc';
        }

        const [tasks, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                include: {
                    assignedTo: { select: { id: true, name: true, avatar: true } },
                    assignees: {
                        include: { user: { select: { id: true, name: true, avatar: true } } },
                    },
                    createdBy: { select: { id: true, name: true } },
                    case: { select: { id: true, title: true, caseNumber: true } },
                    hearing: { select: { id: true, hearingDate: true, courtName: true } },
                    subtasks: {
                        select: { id: true, title: true, status: true },
                    },
                    _count: { select: { comments: true, subtasks: true } },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.task.count({ where }),
        ]);

        return {
            data: tasks,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get task by ID with all related data
     */
    async findOne(id: string, tenantId: string, userId?: string, userRole?: UserRole) {
        const task = await this.prisma.task.findFirst({
            where: { id, tenantId },
            include: {
                assignedTo: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
                assignees: {
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                },
                createdBy: { select: { id: true, name: true } },
                case: { select: { id: true, title: true, caseNumber: true } },
                hearing: { select: { id: true, hearingDate: true, courtName: true } },
                parent: { select: { id: true, title: true } },
                subtasks: {
                    include: {
                        assignedTo: { select: { id: true, name: true, avatar: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                comments: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!task) {
            throw new NotFoundException('المهمة غير موجودة');
        }

        // LAWYER can only view their own tasks
        if (
            userRole === UserRole.LAWYER &&
            userId &&
            task.assignedToId !== userId &&
            task.createdById !== userId
        ) {
            throw new ForbiddenException('لا تملك صلاحية الوصول لهذه المهمة');
        }

        return { data: task };
    }

    /**
     * Create new task
     */
    async create(dto: CreateTaskDto, tenantId: string, userId: string) {
        // Phase 37: Generate flat task code
        const taskCode = await this.entityCodeService.generateFlatCode(tenantId, 'task');

        const data: Prisma.TaskCreateInput = {
            title: dto.title,
            description: dto.description,
            status: dto.status || TaskStatus.TODO,
            priority: dto.priority,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            dueTime: dto.dueTime,
            tags: dto.tags || [],
            tenant: { connect: { id: tenantId } },
            assignedTo: { connect: { id: dto.assignedToId } },
            createdBy: { connect: { id: userId } },
            code: taskCode.code,
            codeNumber: taskCode.codeNumber,
        };

        if (dto.caseId) {
            data.case = { connect: { id: dto.caseId } };
        }

        if (dto.hearingId) {
            data.hearing = { connect: { id: dto.hearingId } };
        }

        if (dto.parentId) {
            data.parent = { connect: { id: dto.parentId } };
        }

        const task = await this.prisma.task.create({
            data,
            include: {
                assignedTo: { select: { id: true, name: true, avatar: true } },
                createdBy: { select: { id: true, name: true } },
                case: { select: { id: true, title: true, caseNumber: true } },
            },
        });

        // Create additional assignees (multi-assignee)
        const additionalIds = (dto.assignedToIds || []).filter(id => id !== dto.assignedToId);
        if (additionalIds.length > 0) {
            await this.prisma.taskAssignee.createMany({
                data: [
                    // Always include the primary assignee
                    { taskId: task.id, userId: dto.assignedToId, tenantId },
                    ...additionalIds.map(uid => ({ taskId: task.id, userId: uid, tenantId })),
                ],
                skipDuplicates: true,
            });
        } else {
            // At minimum, add the primary assignee to TaskAssignee table
            await this.prisma.taskAssignee.create({
                data: { taskId: task.id, userId: dto.assignedToId, tenantId },
            }).catch(() => { /* ignore duplicate */ });
        }

        // Send notification to assigned users (if different from creator)
        const allAssigneeIds = [dto.assignedToId, ...additionalIds];
        for (const assigneeId of allAssigneeIds) {
            if (assigneeId !== userId) {
                await this.notificationsService.create({
                    title: 'مهمة جديدة مسندة إليك',
                    message: `تم إسناد مهمة "${task.title}" إليك`,
                    type: 'INFO',
                    link: `/tasks/${task.id}`,
                    userId: assigneeId,
                    tenantId,
                });
            }
        }

        return {
            data: task,
            message: 'تم إنشاء المهمة بنجاح',
        };
    }

    /**
     * Update task
     */
    async update(
        id: string,
        dto: UpdateTaskDto,
        tenantId: string,
        userId?: string,
        userRole?: UserRole,
    ) {
        const existingTask = await this.prisma.task.findFirst({
            where: { id, tenantId },
        });

        if (!existingTask) {
            throw new NotFoundException('المهمة غير موجودة');
        }

        // LAWYER can only update their own tasks
        if (
            userRole === UserRole.LAWYER &&
            userId &&
            existingTask.assignedToId !== userId &&
            existingTask.createdById !== userId
        ) {
            throw new ForbiddenException('لا تملك صلاحية تعديل هذه المهمة');
        }

        const updateData: Prisma.TaskUpdateInput = {};

        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.status !== undefined) {
            updateData.status = dto.status;
            // Set completedAt when marking as completed
            if (dto.status === TaskStatus.COMPLETED) {
                updateData.completedAt = new Date();
            } else if (existingTask.status === TaskStatus.COMPLETED) {
                // Clear completedAt if moving out of completed status
                updateData.completedAt = null;
            }
        }
        if (dto.priority !== undefined) updateData.priority = dto.priority;
        if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
        if (dto.dueTime !== undefined) updateData.dueTime = dto.dueTime || null;
        if (dto.tags !== undefined) updateData.tags = dto.tags;
        if (dto.assignedToId !== undefined) {
            updateData.assignedTo = { connect: { id: dto.assignedToId } };
        }
        // Handle multi-assignee update
        if (dto.assignedToIds !== undefined) {
            // Delete existing assignees and recreate
            await this.prisma.taskAssignee.deleteMany({ where: { taskId: id } });
            const allIds = dto.assignedToId
                ? [dto.assignedToId, ...dto.assignedToIds.filter(uid => uid !== dto.assignedToId)]
                : dto.assignedToIds;
            if (allIds.length > 0) {
                await this.prisma.taskAssignee.createMany({
                    data: allIds.map(uid => ({ taskId: id, userId: uid, tenantId })),
                    skipDuplicates: true,
                });
            }
        }
        if (dto.caseId !== undefined) {
            if (dto.caseId) {
                updateData.case = { connect: { id: dto.caseId } };
            } else {
                updateData.case = { disconnect: true };
            }
        }
        if (dto.hearingId !== undefined) {
            if (dto.hearingId) {
                updateData.hearing = { connect: { id: dto.hearingId } };
            } else {
                updateData.hearing = { disconnect: true };
            }
        }

        const task = await this.prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                assignedTo: { select: { id: true, name: true, avatar: true } },
                createdBy: { select: { id: true, name: true } },
                case: { select: { id: true, title: true, caseNumber: true } },
            },
        });

        return {
            data: task,
            message: 'تم تحديث المهمة بنجاح',
        };
    }

    /**
     * Delete task
     */
    async remove(id: string, tenantId: string, userId?: string, userRole?: UserRole) {
        const existingTask = await this.prisma.task.findFirst({
            where: { id, tenantId },
        });

        if (!existingTask) {
            throw new NotFoundException('المهمة غير موجودة');
        }

        // LAWYER can only delete their own created tasks
        if (userRole === UserRole.LAWYER && userId && existingTask.createdById !== userId) {
            throw new ForbiddenException('لا تملك صلاحية حذف هذه المهمة');
        }

        await this.prisma.task.delete({ where: { id } });

        return { message: 'تم حذف المهمة بنجاح' };
    }

    /**
     * Remove assignee from task
     */
    async removeAssignee(taskId: string, userId: string, tenantId: string) {
        const task = await this.prisma.task.findFirst({ where: { id: taskId, tenantId } });
        if (!task) throw new NotFoundException('المهمة غير موجودة');

        await this.prisma.taskAssignee.deleteMany({
            where: { taskId, userId },
        });

        return { message: 'تم إزالة الشخص من المهمة' };
    }

    /**
     * Add comment to task
     */
    async addComment(taskId: string, dto: CreateCommentDto, tenantId: string, userId: string) {
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, tenantId },
        });

        if (!task) {
            throw new NotFoundException('المهمة غير موجودة');
        }

        const comment = await this.prisma.taskComment.create({
            data: {
                content: dto.content,
                mentions: dto.mentions as any || [],
                task: { connect: { id: taskId } },
                user: { connect: { id: userId } },
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
        });

        // Send notifications to mentioned users
        if (dto.mentions && dto.mentions.length > 0) {
            const mentionedUserIds = dto.mentions
                .filter(m => m.type === 'user')
                .map(m => m.id)
                .filter(id => id !== userId);
            for (const mentionedUserId of mentionedUserIds) {
                await this.notificationsService.create({
                    title: 'تم ذكرك في تعليق',
                    message: `تم ذكرك في تعليق على مهمة "${task.title}"`,
                    type: 'INFO',
                    link: `/tasks/${taskId}`,
                    userId: mentionedUserId,
                    tenantId,
                });
            }
        }

        return {
            data: comment,
            message: 'تم إضافة التعليق بنجاح',
        };
    }

    /**
     * Delete comment
     */
    async removeComment(commentId: string, tenantId: string, userId: string, userRole: UserRole) {
        const comment = await this.prisma.taskComment.findFirst({
            where: { id: commentId },
            include: { task: { select: { tenantId: true } } },
        });

        if (!comment || comment.task.tenantId !== tenantId) {
            throw new NotFoundException('التعليق غير موجود');
        }

        // Only comment owner or OWNER/ADMIN can delete
        if (userRole === UserRole.LAWYER && comment.userId !== userId) {
            throw new ForbiddenException('لا تملك صلاحية حذف هذا التعليق');
        }

        await this.prisma.taskComment.delete({ where: { id: commentId } });

        return { message: 'تم حذف التعليق بنجاح' };
    }

    /**
     * Get task statistics
     */
    async getStats(
        tenantId: string,
        userId?: string,
        userRole?: UserRole,
    ): Promise<{ data: TaskStats }> {
        const baseWhere: Prisma.TaskWhereInput = { tenantId };

        // LAWYER only sees their own task stats
        if (userRole === UserRole.LAWYER && userId) {
            baseWhere.OR = [
                { assignedToId: userId },
                { createdById: userId },
            ];
        }

        const now = new Date();

        const [
            total,
            todoCount,
            inProgressCount,
            reviewCount,
            blockedCount,
            completedCount,
            cancelledCount,
            overdueCount,
            byPriorityRaw,
        ] = await Promise.all([
            this.prisma.task.count({ where: baseWhere }),
            this.prisma.task.count({ where: { ...baseWhere, status: TaskStatus.TODO } }),
            this.prisma.task.count({ where: { ...baseWhere, status: TaskStatus.IN_PROGRESS } }),
            this.prisma.task.count({ where: { ...baseWhere, status: TaskStatus.REVIEW } }),
            this.prisma.task.count({ where: { ...baseWhere, status: TaskStatus.BLOCKED } }),
            this.prisma.task.count({ where: { ...baseWhere, status: TaskStatus.COMPLETED } }),
            this.prisma.task.count({ where: { ...baseWhere, status: TaskStatus.CANCELLED } }),
            this.prisma.task.count({
                where: {
                    ...baseWhere,
                    dueDate: { lt: now },
                    status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
                },
            }),
            this.prisma.task.groupBy({
                by: ['priority'],
                where: baseWhere,
                _count: { id: true },
            }),
        ]);

        const byPriority: Record<string, number> = {};
        for (const item of byPriorityRaw) {
            byPriority[item.priority.toLowerCase()] = item._count.id;
        }

        const byStatus: Record<string, number> = {
            todo: todoCount,
            in_progress: inProgressCount,
            review: reviewCount,
            blocked: blockedCount,
            completed: completedCount,
            cancelled: cancelledCount,
        };

        return {
            data: {
                total,
                todo: todoCount,
                inProgress: inProgressCount,
                completed: completedCount,
                overdue: overdueCount,
                byPriority,
                byStatus,
            },
        };
    }

    /**
     * Get my tasks (for current user)
     */
    async getMyTasks(tenantId: string, userId: string, filterDto: FilterTasksDto) {
        const modifiedFilter = { ...filterDto, assignedToId: userId };
        return this.findAll(tenantId, modifiedFilter);
    }

    /**
     * Bulk update status
     */
    async bulkUpdateStatus(ids: string[], status: TaskStatus, tenantId: string) {
        const updateData: Prisma.TaskUpdateInput = { status };

        if (status === TaskStatus.COMPLETED) {
            updateData.completedAt = new Date();
        }

        const result = await this.prisma.task.updateMany({
            where: {
                id: { in: ids },
                tenantId,
            },
            data: {
                status,
                completedAt: status === TaskStatus.COMPLETED ? new Date() : undefined,
            },
        });

        return {
            message: `تم تحديث ${result.count} مهمة بنجاح`,
            count: result.count,
        };
    }

    /**
     * Bulk delete
     */
    async bulkDelete(ids: string[], tenantId: string) {
        const result = await this.prisma.task.deleteMany({
            where: {
                id: { in: ids },
                tenantId,
            },
        });

        return {
            message: `تم حذف ${result.count} مهمة بنجاح`,
            count: result.count,
        };
    }
}
