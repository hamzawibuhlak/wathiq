import {
    Controller,
    Get,
    Put,
    Post,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CallCenterSettingsService } from './call-center-settings.service';

@ApiTags('Call Center Settings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('call-center/settings')
export class CallCenterSettingsController {
    constructor(private service: CallCenterSettingsService) { }

    @Get()
    @ApiOperation({ summary: 'جلب إعدادات السنترال' })
    async getSettings(@Request() req: any) {
        return { data: await this.service.getSettings(req.user.tenantId) };
    }

    @Put()
    @ApiOperation({ summary: 'تحديث إعدادات السنترال' })
    async updateSettings(@Request() req: any, @Body() data: any) {
        return {
            data: await this.service.updateSettings(req.user.tenantId, data),
        };
    }

    @Post('test-connection')
    @ApiOperation({ summary: 'اختبار الاتصال بـ GDMS' })
    async testConnection(@Request() req: any) {
        return {
            data: await this.service.testConnection(req.user.tenantId),
        };
    }

    @Post('auto-assign-extension')
    @ApiOperation({ summary: 'تعيين Extension تلقائي للمستخدم الحالي' })
    async autoAssign(@Request() req: any) {
        return {
            data: await this.service.autoAssignExtension(
                req.user.tenantId,
                req.user.id,
                req.user.name,
            ),
        };
    }

    @Post('sync-call-logs')
    @ApiOperation({ summary: 'مزامنة سجل المكالمات من GDMS' })
    async syncCallLogs(@Request() req: any) {
        return {
            data: await this.service.syncCallLogs(req.user.tenantId),
        };
    }
}
