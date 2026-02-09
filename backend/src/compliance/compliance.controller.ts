import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GdprService } from './gdpr.service';
import { SaudiComplianceService } from './saudi-compliance.service';

@ApiTags('Compliance')
@ApiBearerAuth('JWT-auth')
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceController {
    constructor(
        private gdprService: GdprService,
        private saudiCompliance: SaudiComplianceService,
    ) { }

    // ============ COMPLIANCE DASHBOARD ============

    @Get('dashboard')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'عرض لوحة الامتثال الشاملة' })
    @ApiResponse({ status: 200, description: 'بيانات الامتثال' })
    async getComplianceDashboard(@CurrentUser('tenantId') tenantId: string) {
        return this.saudiCompliance.getComplianceDashboard(tenantId);
    }

    // ============ GDPR ENDPOINTS ============

    @Get('gdpr/my-data')
    @ApiOperation({ summary: 'تصدير بيانات المستخدم (GDPR Right to Access)' })
    @ApiResponse({ status: 200, description: 'بيانات المستخدم' })
    async exportMyData(@CurrentUser('id') userId: string) {
        return this.gdprService.exportUserData(userId);
    }

    @Get('gdpr/my-data/download')
    @ApiOperation({ summary: 'تحميل بيانات المستخدم (GDPR Right to Portability)' })
    @ApiResponse({ status: 200, description: 'ملف البيانات' })
    async downloadMyData(
        @CurrentUser('id') userId: string,
    ) {
        return this.gdprService.exportDataPortable(userId, 'json');
    }

    @Post('gdpr/delete-account')
    @ApiOperation({ summary: 'طلب حذف الحساب (GDPR Right to Erasure)' })
    @ApiResponse({ status: 200, description: 'تم الحذف' })
    async requestDeletion(
        @CurrentUser('id') userId: string,
        @Body() body: { keepAudit?: boolean },
    ) {
        return this.gdprService.deleteUserData(userId, body);
    }

    @Post('gdpr/consent')
    @ApiOperation({ summary: 'تحديث الموافقات (GDPR Consent Management)' })
    @ApiResponse({ status: 200, description: 'تم التحديث' })
    async updateConsent(
        @CurrentUser('id') userId: string,
        @Body() consents: {
            dataProcessing?: boolean;
            marketing?: boolean;
            analytics?: boolean;
        },
    ) {
        return this.gdprService.updateConsent(userId, consents);
    }

    // ============ SAUDI COMPLIANCE ENDPOINTS ============

    @Get('saudi/data-localization')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'التحقق من تخزين البيانات محلياً' })
    async checkDataLocalization() {
        return this.saudiCompliance.verifyDataLocalization();
    }

    @Get('saudi/access-controls')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'تدقيق ضوابط الوصول' })
    async auditAccessControls(@CurrentUser('tenantId') tenantId: string) {
        return this.saudiCompliance.auditAccessControls(tenantId);
    }

    @Get('saudi/encryption')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'التحقق من التشفير' })
    async verifyEncryption() {
        return this.saudiCompliance.verifyEncryption();
    }

    @Get('saudi/log-retention')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'التحقق من الاحتفاظ بالسجلات' })
    async checkLogRetention() {
        return this.saudiCompliance.checkLogRetention();
    }

    @Post('saudi/incident-report')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'إنشاء تقرير حادث أمني' })
    @ApiResponse({ status: 201, description: 'تم إنشاء التقرير' })
    async createIncidentReport(
        @CurrentUser('id') userId: string,
        @CurrentUser('tenantId') tenantId: string,
        @Body() incident: {
            type: string;
            severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
            description: string;
            affectedUsers: number;
            dataBreached: boolean;
        },
    ) {
        return this.saudiCompliance.createIncidentReport({
            ...incident,
            tenantId,
            reportedBy: userId,
        });
    }
}
