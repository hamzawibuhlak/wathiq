import { Body, Controller, Get, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CompanySettingsService } from './company-settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { EmailService } from '../email/email.service';

@ApiTags('company-settings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('company-settings')
export class CompanySettingsController {
    constructor(
        private readonly service: CompanySettingsService,
        private readonly emailService: EmailService,
    ) { }

    @Get()
    async get() {
        return { data: await this.service.get() };
    }

    @Patch()
    @Roles('OWNER', 'ADMIN')
    async update(@Body() dto: UpdateCompanySettingsDto) {
        return { data: await this.service.update(dto), message: 'تم تحديث إعدادات المكتب بنجاح' };
    }

    // SMTP-specific endpoints — kept under company-settings for clarity
    @Get('smtp')
    async getSmtp() {
        const s = await this.service.get();
        return {
            data: {
                smtpHost: s.smtpHost,
                smtpPort: s.smtpPort,
                smtpUser: s.smtpUser,
                smtpPass: null,
                smtpFrom: s.smtpFrom,
                smtpFromName: s.smtpFromName,
                smtpSecure: s.smtpSecure,
                smtpEnabled: s.smtpEnabled,
                hasPassword: Boolean(s.smtpPass),
            },
        };
    }

    @Put('smtp')
    @Roles('OWNER', 'ADMIN')
    async updateSmtp(@Body() dto: UpdateCompanySettingsDto) {
        const updated = await this.service.update(dto);
        return {
            data: {
                smtpHost: updated.smtpHost,
                smtpPort: updated.smtpPort,
                smtpUser: updated.smtpUser,
                smtpPass: null,
                smtpFrom: updated.smtpFrom,
                smtpFromName: updated.smtpFromName,
                smtpSecure: updated.smtpSecure,
                smtpEnabled: updated.smtpEnabled,
                hasPassword: Boolean(updated.smtpPass),
            },
        };
    }

    @Post('smtp/test')
    @Roles('OWNER', 'ADMIN')
    async testSmtp(@Body() body: { testEmail: string }) {
        return this.emailService.sendEmail({
            to: body.testEmail,
            subject: 'اختبار إعدادات SMTP - وسم الثقة',
            body: '<p>إذا وصلتك هذه الرسالة فإن إعدادات SMTP تعمل بنجاح.</p>',
        });
    }
}
