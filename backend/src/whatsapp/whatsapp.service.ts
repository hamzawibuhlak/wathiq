import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../common/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { NotificationsService } from '../notifications/notifications.service';

interface WhatsAppConfig {
  apiUrl: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  enabled: boolean;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly defaultApiUrl = 'https://graph.facebook.com/v18.0';

  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Get WhatsApp config for a tenant
   */
  private async getConfig(tenantId: string): Promise<WhatsAppConfig> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        whatsappAccessToken: true,
        whatsappPhoneNumberId: true,
        whatsappBusinessId: true,
        whatsappEnabled: true,
      },
    });

    return {
      apiUrl: this.defaultApiUrl,
      accessToken: tenant?.whatsappAccessToken || '',
      phoneNumberId: tenant?.whatsappPhoneNumberId || '',
      businessAccountId: tenant?.whatsappBusinessId || '',
      enabled: tenant?.whatsappEnabled || false,
    };
  }

  /**
   * Get WhatsApp settings for a tenant
   */
  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        whatsappAccessToken: true,
        whatsappPhoneNumberId: true,
        whatsappBusinessId: true,
        whatsappWebhookToken: true,
        whatsappEnabled: true,
      },
    });

    return {
      // Mask token for security (show only last 10 chars)
      whatsappAccessToken: tenant?.whatsappAccessToken 
        ? '••••••••' + tenant.whatsappAccessToken.slice(-10) 
        : '',
      whatsappPhoneNumberId: tenant?.whatsappPhoneNumberId || '',
      whatsappBusinessId: tenant?.whatsappBusinessId || '',
      whatsappWebhookToken: tenant?.whatsappWebhookToken || '',
      whatsappEnabled: tenant?.whatsappEnabled || false,
      isConfigured: !!(tenant?.whatsappAccessToken && tenant?.whatsappPhoneNumberId),
    };
  }

  /**
   * Update WhatsApp settings for a tenant
   */
  async updateSettings(tenantId: string, data: {
    whatsappAccessToken?: string;
    whatsappPhoneNumberId?: string;
    whatsappBusinessId?: string;
    whatsappWebhookToken?: string;
    whatsappEnabled?: boolean;
  }) {
    // Don't update token if it's the masked version
    const updateData: any = {};
    
    if (data.whatsappAccessToken && !data.whatsappAccessToken.startsWith('••••')) {
      updateData.whatsappAccessToken = data.whatsappAccessToken;
    }
    if (data.whatsappPhoneNumberId !== undefined) {
      updateData.whatsappPhoneNumberId = data.whatsappPhoneNumberId;
    }
    if (data.whatsappBusinessId !== undefined) {
      updateData.whatsappBusinessId = data.whatsappBusinessId;
    }
    if (data.whatsappWebhookToken !== undefined) {
      updateData.whatsappWebhookToken = data.whatsappWebhookToken;
    }
    if (data.whatsappEnabled !== undefined) {
      updateData.whatsappEnabled = data.whatsappEnabled;
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return this.getSettings(tenantId);
  }

  /**
   * Test WhatsApp connection
   */
  async testConnection(tenantId: string) {
    const config = await this.getConfig(tenantId);

    if (!config.accessToken || !config.phoneNumberId) {
      return {
        success: false,
        message: 'الرجاء إدخال Access Token و Phone Number ID أولاً',
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${config.apiUrl}/${config.phoneNumberId}`,
          {
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
            },
          },
        ),
      );

      return {
        success: true,
        message: 'تم الاتصال بنجاح!',
        phoneNumber: response.data.display_phone_number,
        verifiedName: response.data.verified_name,
      };
    } catch (error) {
      this.logger.error('WhatsApp connection test failed:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.error?.message || 'فشل الاتصال - تحقق من البيانات',
        error: error.response?.data?.error,
      };
    }
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phone: string): string {
    // Handle undefined or null
    if (!phone) {
      throw new Error('رقم الهاتف مطلوب');
    }

    // Remove all non-digit characters
    let cleaned = phone.toString().replace(/\D/g, '');

    // Add Saudi country code if not present
    if (!cleaned.startsWith('966')) {
      if (cleaned.startsWith('0')) {
        cleaned = '966' + cleaned.substring(1);
      } else {
        cleaned = '966' + cleaned;
      }
    }

    return cleaned;
  }

  /**
   * Send text message
   */
  async sendTextMessage(params: {
    to: string;
    body: string;
    tenantId: string;
    clientId?: string;
    caseId?: string;
  }) {
    const { to, body, tenantId, clientId, caseId } = params;
    const config = await this.getConfig(tenantId);

    try {
      const formattedPhone = this.formatPhoneNumber(to);

      // Check if WhatsApp is configured
      if (!config.accessToken || !config.phoneNumberId || !config.enabled) {
        // Save message as pending (demo mode)
        const message = await this.prisma.whatsAppMessage.create({
          data: {
            from: config.phoneNumberId || 'demo',
            to: formattedPhone,
            body,
            type: 'text',
            status: 'SENT',
            direction: 'OUTBOUND',
            tenantId,
            clientId,
            caseId,
          },
        });

        this.logger.log(`WhatsApp message saved (demo mode) to ${formattedPhone}`);
        return message;
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${config.apiUrl}/${config.phoneNumberId}/messages`,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'text',
            text: { body },
          },
          {
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Save to database
      const message = await this.prisma.whatsAppMessage.create({
        data: {
          messageId: response.data.messages?.[0]?.id,
          from: config.phoneNumberId,
          to: formattedPhone,
          body,
          type: 'text',
          status: 'SENT',
          direction: 'OUTBOUND',
          tenantId,
          clientId,
          caseId,
        },
      });

      this.logger.log(`WhatsApp message sent to ${formattedPhone}`);

      return message;
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message:', error.response?.data || error.message);

      // Save failed message
      await this.prisma.whatsAppMessage.create({
        data: {
          from: config.phoneNumberId || 'error',
          to: this.formatPhoneNumber(to),
          body,
          type: 'text',
          status: 'FAILED',
          direction: 'OUTBOUND',
          error: error.response?.data?.error?.message || error.message,
          tenantId,
          clientId,
          caseId,
        },
      });

      throw error;
    }
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(params: {
    to: string;
    templateName: string;
    language?: string;
    components?: any[];
    tenantId: string;
    clientId?: string;
    caseId?: string;
  }) {
    const {
      to,
      templateName,
      language = 'ar',
      components = [],
      tenantId,
      clientId,
      caseId,
    } = params;
    const config = await this.getConfig(tenantId);

    try {
      const formattedPhone = this.formatPhoneNumber(to);

      // Demo mode
      if (!config.accessToken || !config.phoneNumberId || !config.enabled) {
        const message = await this.prisma.whatsAppMessage.create({
          data: {
            from: config.phoneNumberId || 'demo',
            to: formattedPhone,
            body: `Template: ${templateName}`,
            type: 'template',
            status: 'SENT',
            direction: 'OUTBOUND',
            tenantId,
            clientId,
            caseId,
          },
        });

        return message;
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${config.apiUrl}/${config.phoneNumberId}/messages`,
          {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
              name: templateName,
              language: { code: language },
              components,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Save to database
      const message = await this.prisma.whatsAppMessage.create({
        data: {
          messageId: response.data.messages?.[0]?.id,
          from: config.phoneNumberId,
          to: formattedPhone,
          body: `Template: ${templateName}`,
          type: 'template',
          status: 'SENT',
          direction: 'OUTBOUND',
          tenantId,
          clientId,
          caseId,
        },
      });

      this.logger.log(`WhatsApp template sent to ${formattedPhone}`);

      return message;
    } catch (error) {
      this.logger.error('Failed to send WhatsApp template:', error.response?.data || error.message);

      await this.prisma.whatsAppMessage.create({
        data: {
          from: config.phoneNumberId || 'error',
          to: this.formatPhoneNumber(to),
          body: `Template: ${templateName}`,
          type: 'template',
          status: 'FAILED',
          direction: 'OUTBOUND',
          error: error.response?.data?.error?.message || error.message,
          tenantId,
          clientId,
          caseId,
        },
      });

      throw error;
    }
  }

  /**
   * Send hearing reminder via WhatsApp
   */
  async sendHearingReminder(hearingId: string, tenantId: string) {
    const hearing = await this.prisma.hearing.findFirst({
      where: { id: hearingId, tenantId },
      include: {
        case: {
          include: {
            client: true,
          },
        },
        client: true,
      },
    });

    if (!hearing) {
      throw new Error('Hearing not found');
    }

    const client = hearing.client || hearing.case?.client;
    if (!client?.phone) {
      throw new Error('Client phone not found');
    }

    const message = `
🔔 *تذكير بموعد جلسة*

عزيزنا العميل،

نذكركم بموعد الجلسة التالية:

📅 التاريخ: ${new Date(hearing.hearingDate).toLocaleDateString('ar-SA')}
⏰ الوقت: ${new Date(hearing.hearingDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
🏛️ المحكمة: ${hearing.courtName || 'غير محدد'}
📋 القضية: ${hearing.case?.title || 'غير محدد'}

يرجى الحضور في الموعد المحدد.

مع تحياتنا،
مكتب المحاماة
    `.trim();

    return this.sendTextMessage({
      to: client.phone,
      body: message,
      tenantId,
      clientId: client.id,
      caseId: hearing.caseId || undefined,
    });
  }

  /**
   * Send invoice reminder
   */
  async sendInvoiceReminder(invoiceId: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        client: true,
        case: true,
      },
    });

    if (!invoice || !invoice.client?.phone) {
      throw new Error('Invoice or client phone not found');
    }

    const message = `
💰 *تذكير بسداد فاتورة*

عزيزنا العميل،

نذكركم بسداد الفاتورة التالية:

📄 رقم الفاتورة: ${invoice.invoiceNumber}
💵 المبلغ: ${Number(invoice.totalAmount).toLocaleString('ar-SA')} ر.س
📅 تاريخ الاستحقاق: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('ar-SA') : 'غير محدد'}
📋 القضية: ${invoice.case?.title || 'غير محدد'}

يرجى التواصل معنا لإتمام عملية السداد.

مع تحياتنا،
مكتب المحاماة
    `.trim();

    return this.sendTextMessage({
      to: invoice.client.phone,
      body: message,
      tenantId,
      clientId: invoice.clientId,
      caseId: invoice.caseId || undefined,
    });
  }

  /**
   * Handle incoming webhook (messages from clients)
   */
  async handleWebhook(payload: any) {
    try {
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages) return;

      for (const message of value.messages) {
        const from = message.from;
        const messageId = message.id;
        const type = message.type;

        let body = '';
        let mediaUrl = null;

        if (type === 'text') {
          body = message.text.body;
        } else if (type === 'image') {
          body = message.image?.caption || '[صورة]';
          mediaUrl = message.image?.id;
        } else if (type === 'document') {
          body = message.document?.filename || '[مستند]';
          mediaUrl = message.document?.id;
        }

        // Find client by phone number
        const client = await this.prisma.client.findFirst({
          where: {
            phone: {
              contains: from.replace('966', ''),
            },
          },
        });

        // Save incoming message
        const savedMessage = await this.prisma.whatsAppMessage.create({
          data: {
            messageId,
            from,
            to: 'inbound',
            body,
            type,
            mediaUrl,
            status: 'DELIVERED',
            direction: 'INBOUND',
            tenantId: client?.tenantId,
            clientId: client?.id,
          },
        });

        // Notify lawyers (if client found)
        if (client) {
          const lawyers = await this.prisma.user.findMany({
            where: {
              tenantId: client.tenantId,
              role: { in: ['OWNER', 'ADMIN', 'LAWYER'] },
            },
          });

          for (const lawyer of lawyers) {
            await this.notificationsService.create({
              title: 'رسالة واتساب جديدة',
              message: `رسالة من ${client.name}: ${body.substring(0, 50)}...`,
              type: 'INFO',
              link: `/whatsapp/messages?clientId=${client.id}`,
              userId: lawyer.id,
              tenantId: client.tenantId,
            });
          }
        }

        this.logger.log(`Incoming WhatsApp message from ${from}`);
      }

      // Handle status updates
      if (value?.statuses) {
        for (const status of value.statuses) {
          await this.prisma.whatsAppMessage.updateMany({
            where: { messageId: status.id },
            data: { status: status.status.toUpperCase() },
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to handle webhook:', error);
      throw error;
    }
  }

  /**
   * Get messages for a tenant
   */
  async getMessages(params: {
    tenantId: string;
    clientId?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, clientId, page = 1, limit = 50 } = params;

    const where: any = { tenantId };
    if (clientId) where.clientId = clientId;

    const [messages, total] = await Promise.all([
      this.prisma.whatsAppMessage.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, phone: true } },
          case: { select: { id: true, title: true, caseNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.whatsAppMessage.count({ where }),
    ]);

    return {
      data: messages,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get conversation with a specific client
   */
  async getConversation(clientId: string, tenantId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!client) throw new Error('Client not found');

    const messages = await this.prisma.whatsAppMessage.findMany({
      where: {
        tenantId,
        OR: [
          { clientId, direction: 'OUTBOUND' },
          { from: { contains: client.phone.replace(/^0/, '') }, direction: 'INBOUND' },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // Last 100 messages
    });

    return {
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
      },
      messages,
    };
  }

  /**
   * Get WhatsApp stats
   */
  async getStats(tenantId: string) {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      total,
      sent,
      delivered,
      read,
      failed,
      last24hCount,
      last7dCount,
      inbound,
      outbound,
    ] = await Promise.all([
      this.prisma.whatsAppMessage.count({ where: { tenantId } }),
      this.prisma.whatsAppMessage.count({ where: { tenantId, status: 'SENT' } }),
      this.prisma.whatsAppMessage.count({ where: { tenantId, status: 'DELIVERED' } }),
      this.prisma.whatsAppMessage.count({ where: { tenantId, status: 'READ' } }),
      this.prisma.whatsAppMessage.count({ where: { tenantId, status: 'FAILED' } }),
      this.prisma.whatsAppMessage.count({
        where: { tenantId, createdAt: { gte: last24h } },
      }),
      this.prisma.whatsAppMessage.count({
        where: { tenantId, createdAt: { gte: last7d } },
      }),
      this.prisma.whatsAppMessage.count({
        where: { tenantId, direction: 'INBOUND' },
      }),
      this.prisma.whatsAppMessage.count({
        where: { tenantId, direction: 'OUTBOUND' },
      }),
    ]);

    return {
      total,
      sent,
      delivered,
      read,
      failed,
      last24h: last24hCount,
      last7d: last7dCount,
      inbound,
      outbound,
    };
  }
}
