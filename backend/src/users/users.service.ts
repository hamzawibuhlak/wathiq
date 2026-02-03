import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { Prisma, UserRole } from '@prisma/client';

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

// User select without password
const userSelect = {
    id: true,
    email: true,
    name: true,
    phone: true,
    role: true,
    avatar: true,
    isActive: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
    tenantId: true,
};

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get all users with pagination and filters
     */
    async findAll(tenantId: string, filterDto: FilterUsersDto): Promise<PaginatedResponse<unknown>> {
        const {
            page = 1,
            limit = 10,
            search,
            role,
            isActive,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filterDto;

        // Build where clause - ALWAYS filter by tenantId
        const where: Prisma.UserWhereInput = { tenantId };

        // Role filter
        if (role) {
            where.role = role;
        }

        // Active filter
        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // Search in name and email
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Calculate skip
        const skip = (page - 1) * limit;

        // Build orderBy
        const orderBy: Prisma.UserOrderByWithRelationInput = {};
        const validSortFields = ['createdAt', 'name', 'email', 'role'];
        if (validSortFields.includes(sortBy)) {
            orderBy[sortBy as keyof Prisma.UserOrderByWithRelationInput] = sortOrder;
        } else {
            orderBy.createdAt = 'desc';
        }

        // Execute queries in parallel
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: userSelect,
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get user by ID
     */
    async findOne(id: string, tenantId: string) {
        const user = await this.prisma.user.findFirst({
            where: { id, tenantId },
            select: {
                ...userSelect,
                _count: {
                    select: {
                        assignedCases: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('المستخدم غير موجود');
        }

        return { data: user };
    }

    /**
     * Create new user
     */
    async create(dto: CreateUserDto, tenantId: string) {
        // Check if email exists globally
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
        }

        // Prevent creating OWNER role
        if (dto.role === UserRole.OWNER) {
            throw new ForbiddenException('لا يمكن إنشاء مستخدم بدور مالك');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                ...dto,
                password: hashedPassword,
                tenantId,
            },
            select: userSelect,
        });

        return {
            data: user,
            message: 'تم إنشاء المستخدم بنجاح',
        };
    }

    /**
     * Update user
     */
    async update(id: string, dto: UpdateUserDto, tenantId: string) {
        // Verify user exists and belongs to tenant
        const existingUser = await this.findOne(id, tenantId);

        // Prevent changing OWNER role
        if (existingUser.data.role === UserRole.OWNER && dto.role && dto.role !== UserRole.OWNER) {
            throw new ForbiddenException('لا يمكن تغيير دور المالك');
        }

        // Prevent setting role to OWNER
        if (dto.role === UserRole.OWNER) {
            throw new ForbiddenException('لا يمكن ترقية مستخدم لدور مالك');
        }

        // Check email uniqueness if updating email
        if (dto.email) {
            const emailUser = await this.prisma.user.findFirst({
                where: { email: dto.email, NOT: { id } },
            });

            if (emailUser) {
                throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
            }
        }

        // Build update data
        const updateData: Prisma.UserUpdateInput = { ...dto };

        // Hash password if provided
        if (dto.password) {
            updateData.password = await bcrypt.hash(dto.password, 10);
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
            select: userSelect,
        });

        return {
            data: user,
            message: 'تم تحديث المستخدم بنجاح',
        };
    }

    /**
     * Soft delete user (set isActive to false)
     */
    async remove(id: string, tenantId: string, currentUserId: string) {
        // Verify user exists and belongs to tenant
        const user = await this.findOne(id, tenantId);

        // Prevent self-deletion
        if (id === currentUserId) {
            throw new ForbiddenException('لا يمكنك حذف حسابك الخاص');
        }

        // Prevent deleting OWNER
        if (user.data.role === UserRole.OWNER) {
            throw new ForbiddenException('لا يمكن حذف حساب المالك');
        }

        // Soft delete - just set isActive to false
        await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });

        return { message: 'تم تعطيل المستخدم بنجاح' };
    }

    /**
     * Reactivate user
     */
    async reactivate(id: string, tenantId: string) {
        await this.findOne(id, tenantId);

        await this.prisma.user.update({
            where: { id },
            data: { isActive: true },
        });

        return { message: 'تم تفعيل المستخدم بنجاح' };
    }

    /**
     * Find all users who can be assigned as responsible lawyers
     */
    async findLawyers(tenantId: string) {
        const lawyers = await this.prisma.user.findMany({
            where: {
                tenantId,
                role: { in: ['LAWYER', 'ADMIN', 'OWNER'] },
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
            orderBy: { name: 'asc' },
        });

        return { data: lawyers };
    }
}
