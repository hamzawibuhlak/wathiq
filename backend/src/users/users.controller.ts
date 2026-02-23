import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../common/prisma/prisma.service';
import { getDefaultModulesByPlan, getRegistrationDefaults } from '../common/constants/modules.constants';
import { UserRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

// DTO for changing role
export class ChangeRoleDto {
    @IsNotEmpty({ message: 'الدور مطلوب' })
    @IsEnum(UserRole, { message: 'الدور غير صالح' })
    role: UserRole;
}

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly prisma: PrismaService,
    ) { }

    // ========== أقسام المكتب (Module Control) ==========
    @Get('my-modules')
    @ApiOperation({ summary: 'الحصول على الأقسام المتاحة للمكتب' })
    async getMyModules(@TenantId() tenantId: string) {
        const tenant = await (this.prisma as any).tenant.findUnique({
            where: { id: tenantId },
            include: { moduleSettings: true },
        });
        if (!tenant) return getRegistrationDefaults();

        // If Super Admin has not configured modules, return restricted defaults
        if (!tenant.moduleSettings) return getRegistrationDefaults();

        const defaults = getDefaultModulesByPlan(tenant.planType);
        const saved = tenant.moduleSettings.modules as Record<string, any>;
        const merged: Record<string, any> = { ...defaults };
        Object.keys(saved).forEach(key => {
            if (merged[key]) merged[key] = { ...merged[key], ...saved[key] };
        });
        return merged;
    }

    // ========== إحصائيات المستخدمين ==========
    @Get('stats')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'إحصائيات المستخدمين' })
    async getStats(@TenantId() tenantId: string) {
        return this.usersService.getStats(tenantId);
    }

    // ========== المحامين فقط - للاختيار في القضايا ==========
    @Get('lawyers')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'الحصول على قائمة المحامين' })
    async getLawyers(@TenantId() tenantId: string) {
        return this.usersService.findLawyers(tenantId);
    }

    // ========== بيانات المستخدم الحالي (للجميع) ==========
    @Get('me')
    @ApiOperation({ summary: 'الحصول على بيانات المستخدم الحالي' })
    @ApiResponse({ status: 200, description: 'بيانات المستخدم' })
    async getMe(
        @CurrentUser('id') userId: string,
        @TenantId() tenantId: string,
    ) {
        return this.usersService.findOne(userId, tenantId);
    }

    @Patch('me')
    @ApiOperation({ summary: 'تحديث بيانات المستخدم الحالي' })
    @ApiResponse({ status: 200, description: 'تم تحديث البيانات بنجاح' })
    async updateMe(
        @CurrentUser('id') userId: string,
        @Body() updateUserDto: UpdateUserDto,
        @TenantId() tenantId: string,
    ) {
        return this.usersService.update(userId, updateUserDto, tenantId);
    }

    // ========== إدارة المستخدمين - OWNER/ADMIN ==========
    @Get()
    @ApiOperation({ summary: 'الحصول على جميع المستخدمين في المكتب' })
    @ApiResponse({ status: 200, description: 'قائمة المستخدمين' })
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async findAll(
        @TenantId() tenantId: string,
        @Query() filterDto: FilterUsersDto,
    ) {
        return this.usersService.findAll(tenantId, filterDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'الحصول على تفاصيل مستخدم' })
    @ApiResponse({ status: 200, description: 'تفاصيل المستخدم' })
    @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.usersService.findOne(id, tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'إضافة مستخدم جديد (محامي/سكرتير)' })
    @ApiResponse({ status: 201, description: 'تم إنشاء المستخدم بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
    @ApiResponse({ status: 409, description: 'البريد الإلكتروني مستخدم بالفعل' })
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async create(
        @Body() createUserDto: CreateUserDto,
        @TenantId() tenantId: string,
    ) {
        return this.usersService.create(createUserDto, tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'تعديل مستخدم' })
    @ApiResponse({ status: 200, description: 'تم تحديث المستخدم بنجاح' })
    @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
        @TenantId() tenantId: string,
    ) {
        return this.usersService.update(id, updateUserDto, tenantId);
    }

    @Patch(':id/role')
    @ApiOperation({ summary: 'تغيير دور مستخدم' })
    @ApiResponse({ status: 200, description: 'تم تغيير الدور بنجاح' })
    @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
    @Roles(UserRole.OWNER)
    async changeRole(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ChangeRoleDto,
        @TenantId() tenantId: string,
        @CurrentUser('id') currentUserId: string,
    ) {
        return this.usersService.changeRole(id, dto.role, tenantId, currentUserId);
    }

    @Patch(':id/deactivate')
    @ApiOperation({ summary: 'تعطيل مستخدم' })
    @ApiResponse({ status: 200, description: 'تم تعطيل المستخدم بنجاح' })
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async deactivate(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
        @CurrentUser('id') currentUserId: string,
    ) {
        return this.usersService.deactivate(id, tenantId, currentUserId);
    }

    @Patch(':id/reactivate')
    @ApiOperation({ summary: 'إعادة تفعيل مستخدم' })
    @ApiResponse({ status: 200, description: 'تم تفعيل المستخدم بنجاح' })
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async reactivate(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.usersService.reactivate(id, tenantId);
    }

    @Patch(':id/verify')
    @ApiOperation({ summary: 'تأكيد بريد مستخدم' })
    @ApiResponse({ status: 200, description: 'تم تأكيد البريد بنجاح' })
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async verifyEmail(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.usersService.verifyEmail(id, tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'تعطيل مستخدم (soft delete)' })
    @ApiResponse({ status: 200, description: 'تم تعطيل المستخدم بنجاح' })
    @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
    @Roles(UserRole.OWNER)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
        @CurrentUser('id') currentUserId: string,
    ) {
        return this.usersService.remove(id, tenantId, currentUserId);
    }
}
