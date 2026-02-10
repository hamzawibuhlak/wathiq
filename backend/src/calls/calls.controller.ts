import { Controller, Post, Get, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Calls')
@ApiBearerAuth()
@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
    constructor(private callsService: CallsService) { }

    @Post('initiate')
    @ApiOperation({ summary: 'Initiate outbound call' })
    async initiateCall(
        @CurrentUser() user: User,
        @Body() body: { to: string; record?: boolean },
    ) {
        return this.callsService.initiateCall(user.id, user.tenantId!, {
            to: body.to,
            record: body.record,
        });
    }

    @Get('history')
    @ApiOperation({ summary: 'Get call history' })
    @ApiQuery({ name: 'userId', required: false })
    @ApiQuery({ name: 'direction', required: false, enum: ['INBOUND', 'OUTBOUND'] })
    @ApiQuery({ name: 'limit', required: false })
    async getHistory(
        @CurrentUser() user: User,
        @Query('userId') userId?: string,
        @Query('direction') direction?: 'INBOUND' | 'OUTBOUND',
        @Query('limit') limit?: string,
    ) {
        return this.callsService.getCallHistory(user.tenantId!, {
            userId,
            direction,
            limit: limit ? parseInt(limit) : 50,
        });
    }

    @Get('analytics')
    @ApiOperation({ summary: 'Get call analytics' })
    @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'] })
    async getAnalytics(
        @CurrentUser() user: User,
        @Query('period') period: 'day' | 'week' | 'month' = 'week',
    ) {
        return this.callsService.getCallAnalytics(user.tenantId!, period);
    }

    @Get(':id/recording')
    @ApiOperation({ summary: 'Get call recording URL' })
    async getRecording(@Param('id') id: string) {
        const url = await this.callsService.getRecordingUrl(id);
        return { recordingUrl: url };
    }
}
