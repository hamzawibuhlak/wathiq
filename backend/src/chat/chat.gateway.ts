import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: { origin: '*', credentials: true },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);
    private onlineUsers = new Map<string, Set<string>>();

    constructor(
        private chatService: ChatService,
        private jwtService: JwtService,
    ) { }

    // =============================================
    // CONNECTION
    // =============================================

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || 'your-secret-key',
            });

            const userId = payload.userId || payload.sub;
            const tenantId = payload.tenantId;

            if (!userId || !tenantId) {
                client.disconnect();
                return;
            }

            client.data.userId = userId;
            client.data.tenantId = tenantId;

            // Join tenant room
            client.join(`tenant:${tenantId}`);

            // Join all of user's conversation rooms
            const conversations = await this.chatService.getUserConversations(userId, tenantId);
            conversations.forEach(conv => client.join(`conversation:${conv.id}`));

            // Track online status
            if (!this.onlineUsers.has(userId)) {
                this.onlineUsers.set(userId, new Set());
            }
            this.onlineUsers.get(userId)!.add(client.id);

            // Broadcast to tenant
            this.server.to(`tenant:${tenantId}`).emit('user:online', { userId });

            this.logger.log(`Chat client connected: ${client.id} (user: ${userId})`);
        } catch (err) {
            this.logger.warn(`Chat auth failed: ${err.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data?.userId;
        const tenantId = client.data?.tenantId;

        if (userId) {
            const sockets = this.onlineUsers.get(userId);
            sockets?.delete(client.id);

            if (!sockets?.size) {
                this.onlineUsers.delete(userId);
                if (tenantId) {
                    this.server.to(`tenant:${tenantId}`).emit('user:offline', {
                        userId,
                        lastSeen: new Date(),
                    });
                }
            }
        }

        this.logger.log(`Chat client disconnected: ${client.id}`);
    }

    // =============================================
    // CHAT EVENTS
    // =============================================

    @SubscribeMessage('chat:send_message')
    async handleSendMessage(
        @MessageBody()
        data: {
            conversationId: string;
            content?: string;
            type?: string;
            replyToId?: string;
            fileUrl?: string;
            fileName?: string;
            fileSize?: number;
            fileMimeType?: string;
            audioDuration?: number;
        },
        @ConnectedSocket() client: Socket,
    ) {
        const { userId, tenantId } = client.data;

        try {
            const message = await this.chatService.sendMessage(
                data.conversationId,
                userId,
                tenantId,
                data as any,
            );

            // Broadcast to all in conversation room
            this.server
                .to(`conversation:${data.conversationId}`)
                .emit('chat:new_message', message);

            return message;
        } catch (err) {
            this.logger.error(`Send message error: ${err.message}`);
            return { error: err.message };
        }
    }

    @SubscribeMessage('chat:typing')
    handleTyping(
        @MessageBody() data: { conversationId: string; isTyping: boolean },
        @ConnectedSocket() client: Socket,
    ) {
        const { userId } = client.data;

        client.to(`conversation:${data.conversationId}`).emit('chat:user_typing', {
            conversationId: data.conversationId,
            userId,
            isTyping: data.isTyping,
        });
    }

    @SubscribeMessage('chat:mark_read')
    async handleMarkRead(
        @MessageBody() data: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { userId, tenantId } = client.data;

        const result = await this.chatService.markAsRead(
            data.conversationId,
            userId,
            tenantId,
        );

        client.to(`conversation:${data.conversationId}`).emit('chat:messages_read', {
            conversationId: data.conversationId,
            userId,
            readAt: new Date(),
        });

        return result;
    }

    @SubscribeMessage('chat:reaction')
    async handleReaction(
        @MessageBody() data: { messageId: string; conversationId: string; emoji: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { userId } = client.data;

        const result = await this.chatService.toggleReaction(
            data.messageId,
            userId,
            data.emoji,
        );

        this.server
            .to(`conversation:${data.conversationId}`)
            .emit('chat:reaction_updated', {
                messageId: data.messageId,
                userId,
                emoji: data.emoji,
                action: result.action,
            });
    }

    @SubscribeMessage('chat:edit_message')
    async handleEditMessage(
        @MessageBody() data: { messageId: string; conversationId: string; content: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { userId, tenantId } = client.data;

        const updated = await this.chatService.editMessage(
            data.messageId,
            userId,
            tenantId,
            data.content,
        );

        this.server
            .to(`conversation:${data.conversationId}`)
            .emit('chat:message_updated', updated);
    }

    @SubscribeMessage('chat:delete_message')
    async handleDeleteMessage(
        @MessageBody() data: { messageId: string; conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { userId, tenantId } = client.data;

        await this.chatService.deleteMessage(data.messageId, userId, tenantId);

        this.server
            .to(`conversation:${data.conversationId}`)
            .emit('chat:message_deleted', {
                messageId: data.messageId,
                conversationId: data.conversationId,
            });
    }

    @SubscribeMessage('chat:join_conversation')
    handleJoinConversation(
        @MessageBody() data: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`conversation:${data.conversationId}`);
    }

    isUserOnline(userId: string): boolean {
        return this.onlineUsers.has(userId);
    }
}
