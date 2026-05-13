import { Controller, Get, Post, Patch, Put, Delete, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

// DTO for notification settings
class NotificationSettingsDto {
    @IsOptional()
    @IsBoolean()
    emailEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    smsEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    hearingReminders?: boolean;

    @IsOptional()
    @IsBoolean()
    caseUpdates?: boolean;

    @IsOptional()
    @IsBoolean()
    invoiceReminders?: boolean;

    @IsOptional()
    @IsBoolean()
    dailyDigest?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(168)
    reminderHoursBefore?: number;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'الحصول على جميع الإشعارات' })
    async findAll(
        @CurrentUser() user: any,

    ) {
        const notifications = await this.notificationsService.findAll(
            user.id,

        );
        return { data: notifications };
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'عدد الإشعارات غير المقروءة' })
    async getUnreadCount(
        @CurrentUser() user: any,

    ) {
        const count = await this.notificationsService.getUnreadCount(
            user.id,

        );
        return { data: { count } };
    }

    @Get('settings')
    @ApiOperation({ summary: 'الحصول على إعدادات الإشعارات' })
    async getSettings(
        @CurrentUser() user: any,

    ) {
        const settings = await this.notificationsService.getSettings(user.id);
        return { data: settings };
    }

    @Put('settings')
    @ApiOperation({ summary: 'تحديث إعدادات الإشعارات' })
    async updateSettings(
        @CurrentUser() user: any,

        @Body() dto: NotificationSettingsDto,
    ) {
        const settings = await this.notificationsService.updateSettings(user.id, dto);
        return { data: settings, message: 'تم حفظ إعدادات الإشعارات' };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'تعليم إشعار كمقروء' })
    async markAsRead(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,

    ) {
        await this.notificationsService.markAsRead(id, user.id);
        return { message: 'تم تعليم الإشعار كمقروء' };
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'تعليم جميع الإشعارات كمقروءة' })
    async markAllAsRead(
        @CurrentUser() user: any,

    ) {
        await this.notificationsService.markAllAsRead(user.id);
        return { message: 'تم تعليم جميع الإشعارات كمقروءة' };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'حذف إشعار' })
    async delete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: any,

    ) {
        await this.notificationsService.delete(id, user.id);
        return { message: 'تم حذف الإشعار' };
    }
}

