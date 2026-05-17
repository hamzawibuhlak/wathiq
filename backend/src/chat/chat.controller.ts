import {
    Controller,
    Get,
    Post,
    Delete,
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
import { ChatGateway } from './chat.gateway';
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
    constructor(
        private chatService: ChatService,
        private chatGateway: ChatGateway,
    ) { }

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
        return this.chatService.markAsRead(conversationId, user.id);
    }
    // Get all conversations for current user
    @Get('conversations')
    getConversations(@CurrentUser() user: any) {
        return this.chatService.getUserConversations(user.id);
    }

    // Get or create DM
    @Post('conversations/dm')
    getOrCreateDM(
        @Body('userId') targetUserId: string,
        @CurrentUser() user: any,
    ) {
        return this.chatService.getOrCreateDM(user.id, targetUserId);
    }

    // Create group
    @Post('conversations/group')
    createGroup(
        @Body() data: { name: string; description?: string; memberIds: string[] },
        @CurrentUser() user: any,
    ) {
        return this.chatService.createGroup(user.id, data);
    }

    // Get messages
    @Get('conversations/:id/messages')
    getMessages(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: number,
    ) {
        return this.chatService.getMessages(id, user.id, {
            cursor,
            limit: limit ? Number(limit) : undefined });
    }

    // Send message via REST (fallback for WebSocket)
    @Post('conversations/:id/messages')
    async sendMessage(
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
        const message = await this.chatService.sendMessage(conversationId, user.id, data as any);
        // Broadcast via socket immediately so all participants see the message in real-time
        this.chatGateway.server
            .to(`conversation:${conversationId}`)
            .emit('chat:new_message', message);
        return message;
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
                } }),
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
            mimeType: file.mimetype };
    }

    // Search messages
    @Get('search')
    searchMessages(
        @Query('q') query: string,
        @CurrentUser() user: any,
    ) {
        return this.chatService.searchMessages(query, user.id);
    }

    // Delete / leave conversation
    @Delete('conversations/:id')
    deleteConversation(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.chatService.deleteConversation(id, user.id, user.tenantId);
    }

    // Forward a message to another conversation
    @Post('messages/:id/forward')
    forwardMessage(
        @Param('id') messageId: string,
        @Body('targetConversationId') targetConversationId: string,
        @CurrentUser() user: any,
    ) {
        return this.chatService.forwardMessage(messageId, targetConversationId, user.id, user.tenantId);
    }

    // ── Group Management ──────────────────────────────
    @Post('conversations/:id/update')
    updateGroup(
        @Param('id') id: string,
        @Body() data: { name?: string; description?: string },
        @CurrentUser() user: any,
    ) {
        return this.chatService.updateGroup(id, user.id, user.tenantId, data);
    }

    @Post('conversations/:id/members')
    addMember(
        @Param('id') id: string,
        @Body('userId') userId: string,
        @CurrentUser() user: any,
    ) {
        return this.chatService.addMember(id, user.id, user.tenantId, userId);
    }

    @Delete('conversations/:id/members/:userId')
    removeMember(
        @Param('id') id: string,
        @Param('userId') userId: string,
        @CurrentUser() user: any,
    ) {
        return this.chatService.removeMember(id, user.id, user.tenantId, userId);
    }

    @Post('conversations/:id/members/:userId/toggle-admin')
    toggleAdmin(
        @Param('id') id: string,
        @Param('userId') userId: string,
        @CurrentUser() user: any,
    ) {
        return this.chatService.toggleAdmin(id, user.id, user.tenantId, userId);
    }
}
