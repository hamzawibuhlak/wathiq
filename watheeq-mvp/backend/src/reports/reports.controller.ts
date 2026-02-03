import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
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

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

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
}
