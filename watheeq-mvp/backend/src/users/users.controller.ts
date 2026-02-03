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
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

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

    // ========== إدارة المستخدمين - OWNER فقط ==========
    @Get()
    @ApiOperation({ summary: 'الحصول على جميع المستخدمين في المكتب' })
    @ApiResponse({ status: 200, description: 'قائمة المستخدمين' })
    @Roles(UserRole.OWNER)
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
    @Roles(UserRole.OWNER)
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
    @Roles(UserRole.OWNER)
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
    @Roles(UserRole.OWNER)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
        @TenantId() tenantId: string,
    ) {
        return this.usersService.update(id, updateUserDto, tenantId);
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
