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
    ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { HearingsService } from './hearings.service';
import { CreateHearingDto } from './dto/create-hearing.dto';
import { UpdateHearingDto } from './dto/update-hearing.dto';
import { FilterHearingsDto } from './dto/filter-hearings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Hearings')
@ApiBearerAuth('JWT-auth')
@Controller('hearings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HearingsController {
    constructor(private readonly hearingsService: HearingsService) { }

    @Get()
    @ApiOperation({ summary: 'الحصول على جميع الجلسات مع pagination و filters' })
    @ApiResponse({ status: 200, description: 'قائمة الجلسات' })
    async findAll(
        @TenantId() tenantId: string,
        @Query() filterDto: FilterHearingsDto,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.hearingsService.findAll(tenantId, filterDto, userId, userRole);
    }

    @Get('calendar')
    @ApiOperation({ summary: 'الحصول على الجلسات للتقويم (شهر كامل)' })
    @ApiResponse({ status: 200, description: 'جلسات التقويم' })
    @ApiQuery({ name: 'month', required: false, description: 'الشهر (1-12)' })
    @ApiQuery({ name: 'year', required: false, description: 'السنة' })
    async getCalendar(
        @TenantId() tenantId: string,
        @Query('month') month?: number,
        @Query('year') year?: number,
        @CurrentUser('id') userId?: string,
        @CurrentUser('role') userRole?: UserRole,
    ) {
        return this.hearingsService.getCalendar(tenantId, month, year, userId, userRole);
    }

    @Get('upcoming')
    @ApiOperation({ summary: 'الحصول على الجلسات القادمة (7 أيام)' })
    @ApiResponse({ status: 200, description: 'الجلسات القادمة' })
    @ApiQuery({ name: 'days', required: false, description: 'عدد الأيام (افتراضي: 7)' })
    async getUpcoming(
        @TenantId() tenantId: string,
        @Query('days') days?: number,
        @CurrentUser('id') userId?: string,
        @CurrentUser('role') userRole?: UserRole,
    ) {
        return this.hearingsService.getUpcoming(tenantId, days, userId, userRole);
    }

    @Get(':id')
    @ApiOperation({ summary: 'الحصول على تفاصيل جلسة واحدة' })
    @ApiResponse({ status: 200, description: 'تفاصيل الجلسة' })
    @ApiResponse({ status: 404, description: 'الجلسة غير موجودة' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.hearingsService.findOne(id, tenantId);
    }

    @Post()
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER, UserRole.SECRETARY)
    @ApiOperation({ summary: 'إنشاء جلسة جديدة' })
    @ApiResponse({ status: 201, description: 'تم إنشاء الجلسة بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
    async create(
        @Body() createHearingDto: CreateHearingDto,
        @TenantId() tenantId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.hearingsService.create(createHearingDto, tenantId, userId);
    }

    @Patch(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER, UserRole.SECRETARY)
    @ApiOperation({ summary: 'تعديل جلسة' })
    @ApiResponse({ status: 200, description: 'تم تحديث الجلسة بنجاح' })
    @ApiResponse({ status: 404, description: 'الجلسة غير موجودة' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateHearingDto: UpdateHearingDto,
        @TenantId() tenantId: string,
    ) {
        return this.hearingsService.update(id, updateHearingDto, tenantId);
    }

    @Delete(':id')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف جلسة' })
    @ApiResponse({ status: 200, description: 'تم حذف الجلسة بنجاح' })
    @ApiResponse({ status: 404, description: 'الجلسة غير موجودة' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.hearingsService.remove(id, tenantId);
    }

    @Post(':id/send-reminder')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'إرسال تذكير بالجلسة عبر البريد الإلكتروني' })
    @ApiResponse({ status: 200, description: 'تم إرسال التذكير بنجاح' })
    @ApiResponse({ status: 400, description: 'العميل لا يملك بريد إلكتروني' })
    @ApiResponse({ status: 404, description: 'الجلسة غير موجودة' })
    async sendReminder(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.hearingsService.sendReminder(id, tenantId);
    }

    @Patch('bulk/status')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'تحديث حالة عدة جلسات' })
    @ApiResponse({ status: 200, description: 'تم تحديث الجلسات بنجاح' })
    async bulkUpdateStatus(
        @Body() body: { ids: string[]; status: string },
        @TenantId() tenantId: string,
    ) {
        return this.hearingsService.bulkUpdateStatus(body.ids, body.status, tenantId);
    }

    @Delete('bulk/delete')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف عدة جلسات' })
    @ApiResponse({ status: 200, description: 'تم حذف الجلسات بنجاح' })
    async bulkDelete(
        @Body() body: { ids: string[] },
        @TenantId() tenantId: string,
    ) {
        return this.hearingsService.bulkDelete(body.ids, tenantId);
    }
}
