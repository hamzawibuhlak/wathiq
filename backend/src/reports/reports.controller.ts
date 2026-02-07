import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Res,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReportDto, UpdateReportDto, ExecuteReportDto } from './dto';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    // ========== Report Templates CRUD ==========

    @Post()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'إنشاء قالب تقرير جديد' })
    create(
        @Body() dto: CreateReportDto,
        @CurrentUser('id') userId: string,
        @TenantId() tenantId: string,
    ) {
        return this.reportsService.create(dto, userId, tenantId);
    }

    @Get('templates')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'الحصول على جميع قوالب التقارير' })
    findAllReports(@TenantId() tenantId: string) {
        return this.reportsService.findAllReports(tenantId);
    }

    @Get('templates/:id')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'الحصول على قالب تقرير بالمعرف' })
    findOneReport(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.reportsService.findOneReport(id, tenantId);
    }

    @Patch('templates/:id')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'تحديث قالب تقرير' })
    updateReport(
        @Param('id') id: string,
        @Body() dto: UpdateReportDto,
        @TenantId() tenantId: string,
    ) {
        return this.reportsService.updateReport(id, dto, tenantId);
    }

    @Delete('templates/:id')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'حذف قالب تقرير' })
    removeReport(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.reportsService.removeReport(id, tenantId);
    }

    // ========== Report Execution ==========

    @Post('templates/:id/execute')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'تنفيذ تقرير وإنشاء ملف التصدير' })
    execute(
        @Param('id') id: string,
        @Body() dto: ExecuteReportDto,
        @CurrentUser('id') userId: string,
        @TenantId() tenantId: string,
    ) {
        return this.reportsService.execute(id, dto, userId, tenantId);
    }

    @Get('executions/:id')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'الحصول على حالة تنفيذ التقرير' })
    getExecution(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.reportsService.getExecution(id, tenantId);
    }

    @Get('executions/:id/download')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'تحميل ملف التقرير' })
    async download(
        @Param('id') executionId: string,
        @TenantId() tenantId: string,
        @Res() res: Response,
    ) {
        const execution = await this.reportsService.getExecution(executionId, tenantId);

        // Check if report execution completed
        if (execution.status !== 'COMPLETED') {
            throw new BadRequestException('التقرير لم يكتمل بعد');
        }

        // Check if file path exists and file is available
        if (!execution.filePath || !existsSync(execution.filePath)) {
            throw new NotFoundException('ملف التقرير غير موجود أو تم حذفه');
        }

        const file = createReadStream(execution.filePath);
        const filename = execution.filePath.split('/').pop();

        res.set({
            'Content-Type': this.getContentType(execution.format),
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename || 'report')}"`,
        });

        file.pipe(res);
    }

    // ========== Dashboard & Analytics Reports ==========

    @Get('dashboard')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'إحصائيات لوحة التحكم الشاملة' })
    @ApiResponse({ status: 200, description: 'إحصائيات لوحة التحكم' })
    async getDashboardStats(@TenantId() tenantId: string) {
        return this.reportsService.getDashboardStats(tenantId);
    }

    @Get('financial')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'التقرير المالي' })
    @ApiQuery({ name: 'startDate', required: false, description: 'تاريخ البداية' })
    @ApiQuery({ name: 'endDate', required: false, description: 'تاريخ النهاية' })
    @ApiResponse({ status: 200, description: 'التقرير المالي' })
    async getFinancialReport(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @TenantId() tenantId: string,
    ) {
        return this.reportsService.getFinancialReport(tenantId, startDate, endDate);
    }

    @Get('cases')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'تقرير القضايا' })
    @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'], description: 'الفترة الزمنية' })
    @ApiResponse({ status: 200, description: 'تقرير القضايا' })
    async getCasesReport(
        @Query('period') period: string = 'month',
        @TenantId() tenantId: string,
    ) {
        return this.reportsService.getCasesReport(tenantId, period);
    }

    @Get('performance')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'تقرير أداء المحامين' })
    @ApiResponse({ status: 200, description: 'تقرير الأداء' })
    async getPerformanceReport(@TenantId() tenantId: string) {
        return this.reportsService.getPerformanceReport(tenantId);
    }

    // ========== Helpers ==========

    private getContentType(format: string): string {
        switch (format) {
            case 'PDF': return 'application/pdf';
            case 'EXCEL': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case 'CSV': return 'text/csv; charset=utf-8';
            case 'JSON': return 'application/json';
            default: return 'application/octet-stream';
        }
    }
}
