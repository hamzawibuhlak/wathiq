import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';

// DTOs
class SendMessageDto {
    @IsNotEmpty({ message: 'الموضوع مطلوب' })
    @IsString()
    @MaxLength(200)
    subject: string;

    @IsNotEmpty({ message: 'محتوى الرسالة مطلوب' })
    @IsString()
    @MaxLength(5000)
    content: string;

    @IsNotEmpty({ message: 'المستلم مطلوب' })
    @IsUUID()
    receiverId: string;
}

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Post()
    @ApiOperation({ summary: 'إرسال رسالة جديدة' })
    async send(
        @Body() dto: SendMessageDto,
        @CurrentUser('id') userId: string,

    ) {
        const message = await this.messagesService.send(dto, userId);
        return { data: message, message: 'تم إرسال الرسالة بنجاح' };
    }

    @Get('inbox')
    @ApiOperation({ summary: 'الرسائل الواردة' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    async getInbox(
        @CurrentUser('id') userId: string,

        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    ) {
        const result = await this.messagesService.getInbox(userId, { limit, offset });
        return result;
    }

    @Get('sent')
    @ApiOperation({ summary: 'الرسائل المرسلة' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    async getSent(
        @CurrentUser('id') userId: string,

        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    ) {
        const result = await this.messagesService.getSent(userId, { limit, offset });
        return result;
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'عدد الرسائل غير المقروءة' })
    async getUnreadCount(
        @CurrentUser('id') userId: string,

    ) {
        const count = await this.messagesService.getUnreadCount(userId);
        return { data: { count } };
    }

    @Get('recipients')
    @ApiOperation({ summary: 'قائمة المستلمين المتاحين' })
    async getRecipients(
        @CurrentUser('id') userId: string,

    ) {
        const recipients = await this.messagesService.getRecipients(userId);
        return { data: recipients };
    }

    @Get(':id')
    @ApiOperation({ summary: 'عرض رسالة محددة' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') userId: string,

    ) {
        const message = await this.messagesService.findOne(id, userId);
        return { data: message };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'تعليم رسالة كمقروءة' })
    async markAsRead(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') userId: string,

    ) {
        await this.messagesService.markAsRead(id, userId);
        return { message: 'تم تعليم الرسالة كمقروءة' };
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'تعليم جميع الرسائل كمقروءة' })
    async markAllAsRead(
        @CurrentUser('id') userId: string,

    ) {
        await this.messagesService.markAllAsRead(userId);
        return { message: 'تم تعليم جميع الرسائل كمقروءة' };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'حذف رسالة' })
    async delete(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') userId: string,

    ) {
        await this.messagesService.delete(id, userId);
        return { message: 'تم حذف الرسالة' };
    }
}
