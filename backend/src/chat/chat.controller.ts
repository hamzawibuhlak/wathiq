import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

// In-memory store for user online status (userId -> last heartbeat timestamp)
const onlineUsers = new Map<string, number>();

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) { }

    // Heartbeat - user pings every 10s to stay online
    @Post('heartbeat')
    heartbeat(@CurrentUser() user: any) {
        onlineUsers.set(user.id, Date.now());
        return { status: 'ok' };
    }

    // Get online users list
    @Get('online-users')
    getOnlineUsers() {
        const now = Date.now();
        const threshold = 30000; // 30 seconds
        const online: string[] = [];
        onlineUsers.forEach((lastSeen, userId) => {
            if (now - lastSeen < threshold) {
                online.push(userId);
            } else {
                onlineUsers.delete(userId);
            }
        });
        return online;
    }

    // Mark conversation as read via REST
    @Post('conversations/:id/read')
    markAsRead(
        @Param('id') conversationId: string,
        @CurrentUser() user: any,
    ) {
        return this.chatService.markAsRead(conversationId, user.id, user.tenantId);
    }
    // Get all conversations for current user
    @Get('conversations')
    getConversations(@CurrentUser() user: any) {
        return this.chatService.getUserConversations(user.id, user.tenantId);
    }

    // Get or create DM
    @Post('conversations/dm')
    getOrCreateDM(
        @Body('userId') targetUserId: string,
        @CurrentUser() user: any,
    ) {
        return this.chatService.getOrCreateDM(user.id, targetUserId, user.tenantId);
    }

    // Create group
    @Post('conversations/group')
    createGroup(
        @Body() data: { name: string; description?: string; memberIds: string[] },
        @CurrentUser() user: any,
    ) {
        return this.chatService.createGroup(user.id, user.tenantId, data);
    }

    // Get messages
    @Get('conversations/:id/messages')
    getMessages(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: number,
    ) {
        return this.chatService.getMessages(id, user.id, user.tenantId, {
            cursor,
            limit: limit ? Number(limit) : undefined,
        });
    }

    // Send message via REST (fallback for WebSocket)
    @Post('conversations/:id/messages')
    sendMessage(
        @Param('id') conversationId: string,
        @Body() data: {
            content?: string;
            type?: string;
            replyToId?: string;
            fileUrl?: string;
            fileName?: string;
            fileSize?: number;
            fileMimeType?: string;
        },
        @CurrentUser() user: any,
    ) {
        return this.chatService.sendMessage(conversationId, user.id, user.tenantId, data as any);
    }

    // Upload file for chat
    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: join(process.cwd(), 'uploads', 'chat'),
                filename: (_req, file, cb) => {
                    const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
                    cb(null, uniqueName);
                },
            }),
            limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
        }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('لم يتم رفع ملف');
        }

        return {
            url: `/uploads/chat/${file.filename}`,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
        };
    }

    // Search messages
    @Get('search')
    searchMessages(
        @Query('q') query: string,
        @CurrentUser() user: any,
    ) {
        return this.chatService.searchMessages(query, user.id, user.tenantId);
    }
}
