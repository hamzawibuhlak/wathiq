import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class WebSocketGatewayService
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGatewayService.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(private jwtService: JwtService) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        // Allow connection but don't join rooms
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      const userId = payload.userId || payload.clientId;
      const tenantId = payload.tenantId;

      if (!userId || !tenantId) {
        client.disconnect();
        return;
      }

      // Store socket for user
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join rooms
      client.join(`tenant:${tenantId}`);
      client.join(`user:${userId}`);

      // Store data on socket
      client.data.userId = userId;
      client.data.tenantId = tenantId;
      client.data.isClient = !!payload.clientId;

      this.logger.log(`Client connected: ${client.id} (user: ${userId}, tenant: ${tenantId})`);
    } catch (error) {
      this.logger.error('Connection error:', error.message);
      // Don't disconnect, allow anonymous connection
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

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  /**
   * Get online users count for a tenant
   */
  getOnlineUsersCount(tenantId: string): number {
    let count = 0;
    this.server?.sockets?.sockets?.forEach((socket) => {
      if (socket.data?.tenantId === tenantId) {
        count++;
      }
    });
    return count;
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId: string, notification: any) {
    this.server?.to(`user:${userId}`).emit('notification', notification);
    this.logger.debug(`Sent notification to user ${userId}`);
  }

  /**
   * Send notification to all users in a tenant
   */
  sendNotificationToTenant(tenantId: string, notification: any) {
    this.server?.to(`tenant:${tenantId}`).emit('notification', notification);
    this.logger.debug(`Sent notification to tenant ${tenantId}`);
  }

  /**
   * Broadcast case update
   */
  broadcastCaseUpdate(tenantId: string, caseData: any) {
    this.server?.to(`tenant:${tenantId}`).emit('case:update', caseData);
    this.logger.debug(`Broadcast case update to tenant ${tenantId}`);
  }

  /**
   * Broadcast hearing update
   */
  broadcastHearingUpdate(tenantId: string, hearingData: any) {
    this.server?.to(`tenant:${tenantId}`).emit('hearing:update', hearingData);
    this.logger.debug(`Broadcast hearing update to tenant ${tenantId}`);
  }

  /**
   * Broadcast invoice update
   */
  broadcastInvoiceUpdate(tenantId: string, invoiceData: any) {
    this.server?.to(`tenant:${tenantId}`).emit('invoice:update', invoiceData);
    this.logger.debug(`Broadcast invoice update to tenant ${tenantId}`);
  }

  /**
   * Broadcast new WhatsApp message
   */
  broadcastWhatsAppMessage(tenantId: string, message: any) {
    this.server?.to(`tenant:${tenantId}`).emit('whatsapp:message', message);
    this.logger.debug(`Broadcast WhatsApp message to tenant ${tenantId}`);
  }

  /**
   * Broadcast document upload
   */
  broadcastDocumentUpload(tenantId: string, document: any) {
    this.server?.to(`tenant:${tenantId}`).emit('document:upload', document);
    this.logger.debug(`Broadcast document upload to tenant ${tenantId}`);
  }

  /**
   * Broadcast client update (for client portal)
   */
  broadcastClientUpdate(clientId: string, data: any) {
    this.server?.to(`user:${clientId}`).emit('client:update', data);
    this.logger.debug(`Broadcast client update to client ${clientId}`);
  }

  // =====================================================
  // Phase 32: WhatsApp QR (Baileys)
  // =====================================================

  /**
   * Broadcast WhatsApp QR code to tenant admins
   */
  broadcastWhatsAppQR(tenantId: string, qrDataUrl: string) {
    this.server?.to(`tenant:${tenantId}`).emit('whatsapp:qr', { qr: qrDataUrl });
    this.logger.debug(`Broadcast WhatsApp QR to tenant ${tenantId}`);
  }

  /**
   * Broadcast WhatsApp connection status to tenant admins
   */
  broadcastWhatsAppStatus(tenantId: string, status: string, phone?: string) {
    this.server?.to(`tenant:${tenantId}`).emit('whatsapp:status', { status, phone });
    this.logger.debug(`Broadcast WhatsApp status '${status}' to tenant ${tenantId}`);
  }
}

