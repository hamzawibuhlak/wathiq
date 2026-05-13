import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

const FIRM_ROOM = 'firm';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true },
  namespace: '/ws' })
export class WebSocketGatewayService
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGatewayService.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key' });

      const userId = payload.userId || payload.clientId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      client.join(FIRM_ROOM);
      client.join(`user:${userId}`);

      client.data.userId = userId;
      client.data.isClient = !!payload.clientId;

      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch (error) {
      this.logger.error('Connection error:', error.message);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId)!;
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server?.to(`user:${userId}`).emit('notification', notification);
    this.logger.debug(`Sent notification to user ${userId}`);
  }

  sendNotificationToFirm(notification: any) {
    this.server?.to(FIRM_ROOM).emit('notification', notification);
    this.logger.debug('Sent notification to firm');
  }

  broadcastCaseUpdate(caseData: any) {
    this.server?.to(FIRM_ROOM).emit('case:update', caseData);
  }

  broadcastHearingUpdate(hearingData: any) {
    this.server?.to(FIRM_ROOM).emit('hearing:update', hearingData);
  }

  broadcastInvoiceUpdate(invoiceData: any) {
    this.server?.to(FIRM_ROOM).emit('invoice:update', invoiceData);
  }

  broadcastWhatsAppMessage(message: any) {
    this.server?.to(FIRM_ROOM).emit('whatsapp:message', message);
  }

  broadcastDocumentUpload(document: any) {
    this.server?.to(FIRM_ROOM).emit('document:upload', document);
  }

  broadcastClientUpdate(clientId: string, data: any) {
    this.server?.to(`user:${clientId}`).emit('client:update', data);
  }

  broadcastWhatsAppQR(qrDataUrl: string) {
    this.server?.to(FIRM_ROOM).emit('whatsapp:qr', { qr: qrDataUrl });
  }

  broadcastWhatsAppStatus(status: string, phone?: string) {
    this.server?.to(FIRM_ROOM).emit('whatsapp:status', { status, phone });
  }
}
