import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Query,
    DefaultValuePipe,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { SmsService } from './sms.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@ApiTags('SMS')
@ApiBearerAuth()
@Controller('sms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmsController {
    constructor(
        private readonly smsService: SmsService,
        private readonly prisma: PrismaService,
    ) { }

    @Get('logs')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'سجل رسائل SMS' })
    async getSmsLogs(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @TenantId() tenantId: string,
    ) {
        const [logs, total] = await Promise.all([
            this.prisma.smsLog.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: (page - 1) * limit,
            }),
            this.prisma.smsLog.count({ where: { tenantId } }),
        ]);

        return {
            data: logs,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    @Post('send')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
    @ApiOperation({ summary: 'إرسال رسالة SMS' })
    async sendSms(
        @Body() body: { to: string; message: string },
        @TenantId() tenantId: string,
    ) {
        const result = await this.smsService.sendSMS({
            ...body,
            tenantId,
        });

        if (!result.success) {
            return { message: 'فشل إرسال الرسالة', error: result.error };
        }

        return { message: 'تم إرسال الرسالة بنجاح' };
    }

    @Post('send-bulk')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'إرسال رسائل SMS جماعية' })
    async sendBulk(
        @Body() body: { recipients: string[]; message: string },
        @TenantId() tenantId: string,
    ) {
        const result = await this.smsService.sendBulkSMS({
            ...body,
            tenantId,
        });

        return {
            message: 'تم إرسال الرسائل',
            data: result,
        };
    }
}
