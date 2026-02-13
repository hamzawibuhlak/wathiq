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
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SipExtensionService } from './sip-extension.service';
import { CallRecordService } from './call-record.service';

@ApiTags('Call Center')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('call-center')
export class CallCenterController {
    constructor(
        private sipExtService: SipExtensionService,
        private callRecordService: CallRecordService,
    ) { }

    // ── SIP Extensions ──────────────────────────────

    @Get('extension')
    @ApiOperation({ summary: 'بيانات Extension المستخدم الحالي' })
    async getMyExtension(@Request() req: any) {
        return this.sipExtService.getExtensionForUser(
            req.user.id,
            req.user.tenantId,
        );
    }

    @Get('extensions')
    @ApiOperation({ summary: 'جميع Extensions المكتب' })
    async getExtensions(@Request() req: any) {
        return this.sipExtService.getExtensions(req.user.tenantId);
    }

    @Post('extension')
    @ApiOperation({ summary: 'تعيين Extension لموظف' })
    async assignExtension(@Request() req: any, @Body() body: {
        userId: string;
        extension: string;
        password: string;
        ucmHost: string;
        ucmPort?: number;
        displayName: string;
    }) {
        return this.sipExtService.assignExtension(req.user.tenantId, body);
    }

    @Patch('extension/:id')
    @ApiOperation({ summary: 'تحديث Extension' })
    async updateExtension(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: {
            extension?: string;
            displayName?: string;
            password?: string;
            ucmHost?: string;
            ucmPort?: number;
            isActive?: boolean;
        },
    ) {
        return this.sipExtService.updateExtension(id, req.user.tenantId, body);
    }

    @Delete('extension/:id')
    @ApiOperation({ summary: 'حذف Extension' })
    async deleteExtension(@Request() req: any, @Param('id') id: string) {
        return this.sipExtService.deleteExtension(id, req.user.tenantId);
    }

    // ── Call Records ────────────────────────────────

    @Post('calls')
    @ApiOperation({ summary: 'تسجيل مكالمة' })
    async logCall(@Request() req: any, @Body() body: {
        callId: string;
        direction: 'INBOUND' | 'OUTBOUND';
        fromNumber: string;
        toNumber: string;
        status: string;
    }) {
        return this.callRecordService.logCall(
            req.user.tenantId,
            req.user.id,
            body,
        );
    }

    @Patch('calls/:callId')
    @ApiOperation({ summary: 'تحديث حالة مكالمة' })
    async updateCallStatus(
        @Request() req: any,
        @Param('callId') callId: string,
        @Body() body: {
            status: string;
            answeredAt?: Date;
            endedAt?: Date;
            duration?: number;
        },
    ) {
        return this.callRecordService.updateCallStatus(
            callId,
            req.user.tenantId,
            body,
        );
    }

    @Patch('calls/:callId/notes')
    @ApiOperation({ summary: 'إضافة ملاحظات للمكالمة' })
    async addNotes(
        @Request() req: any,
        @Param('callId') callId: string,
        @Body() body: { notes: string; caseId?: string },
    ) {
        return this.callRecordService.addNotes(
            callId,
            req.user.tenantId,
            body.notes,
            body.caseId,
        );
    }

    @Get('calls')
    @ApiOperation({ summary: 'سجل المكالمات' })
    async getCallHistory(
        @Request() req: any,
        @Query('agentId') agentId?: string,
        @Query('clientId') clientId?: string,
        @Query('direction') direction?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('page') page?: string,
    ) {
        return this.callRecordService.getCallHistory(req.user.tenantId, {
            agentId,
            clientId,
            direction,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            page: page ? parseInt(page) : 1,
        });
    }

    @Get('stats')
    @ApiOperation({ summary: 'إحصائيات المكالمات' })
    async getStats(@Request() req: any) {
        return this.callRecordService.getStats(req.user.tenantId);
    }
}
