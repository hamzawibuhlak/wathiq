import {
    Controller,
    Get,
    Delete,
    Param,
    UseGuards,
    Headers,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
} from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Sessions')
@ApiBearerAuth('JWT-auth')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) {}

    @Get('me')
    @ApiOperation({ summary: 'الحصول على جلسات المستخدم الحالي' })
    @ApiResponse({ status: 200, description: 'قائمة الجلسات النشطة' })
    async getMySessions(@CurrentUser('id') userId: string) {
        return this.sessionsService.findUserSessions(userId);
    }

    @Get('me/stats')
    @ApiOperation({ summary: 'إحصائيات جلسات المستخدم' })
    @ApiResponse({ status: 200, description: 'إحصائيات الجلسات' })
    async getMyStats(@CurrentUser('id') userId: string) {
        return this.sessionsService.getStats(userId);
    }

    @Delete('me/all')
    @ApiOperation({ summary: 'تسجيل الخروج من جميع الأجهزة' })
    @ApiResponse({ status: 200, description: 'تم تسجيل الخروج بنجاح' })
    async logoutAll(
        @CurrentUser('id') userId: string,
        @Headers('authorization') authHeader: string,
    ) {
        // Extract current token to optionally keep it
        const currentToken = authHeader?.replace('Bearer ', '');
        return this.sessionsService.invalidateAll(userId, currentToken);
    }

    @Delete('me/everywhere')
    @ApiOperation({ summary: 'تسجيل الخروج من كل مكان بما فيه الجلسة الحالية' })
    @ApiResponse({ status: 200, description: 'تم تسجيل الخروج بنجاح' })
    async logoutEverywhere(@CurrentUser('id') userId: string) {
        return this.sessionsService.logoutEverywhere(userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'إنهاء جلسة محددة' })
    @ApiResponse({ status: 200, description: 'تم إنهاء الجلسة بنجاح' })
    @ApiResponse({ status: 404, description: 'الجلسة غير موجودة' })
    async invalidateSession(
        @Param('id') sessionId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.sessionsService.invalidate(sessionId, userId);
    }
}
