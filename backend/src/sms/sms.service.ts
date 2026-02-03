import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private readonly apiUrl: string;
    private readonly apiKey: string;
    private readonly senderId: string;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        // Using UNIFONIC as example - can be changed to MSEGAT or others
        this.apiUrl = this.configService.get('SMS_API_URL', 'https://api.unifonic.com/rest/SMS/messages');
        this.apiKey = this.configService.get('SMS_API_KEY', '');
        this.senderId = this.configService.get('SMS_SENDER_ID', 'Watheeq');
    }

    async sendSMS(data: {
        to: string;
        message: string;
        tenantId: string;
    }) {
        try {
            // Clean phone number (remove spaces, dashes, etc.)
            const cleanPhone = data.to.replace(/\D/g, '');

            // Ensure it starts with country code (966 for Saudi)
            const phone = cleanPhone.startsWith('966')
                ? cleanPhone
                : `966${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;

            // Check if API key is configured
            if (!this.apiKey) {
                this.logger.warn('SMS API key not configured');
                // Log as pending
                await this.prisma.smsLog.create({
                    data: {
                        to: phone,
                        message: data.message,
                        status: 'PENDING',
                        error: 'SMS API key not configured',
                        tenantId: data.tenantId,
                    },
                });
                return { success: false, error: 'SMS API key not configured' };
            }

            // Send SMS via Unifonic API
            const response = await axios.post(
                this.apiUrl,
                {
                    AppSid: this.apiKey,
                    Recipient: phone,
                    Body: data.message,
                    SenderID: this.senderId,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            // Log success
            await this.prisma.smsLog.create({
                data: {
                    to: phone,
                    message: data.message,
                    status: 'SENT',
                    sentAt: new Date(),
                    response: JSON.stringify(response.data),
                    tenantId: data.tenantId,
                },
            });

            this.logger.log(`SMS sent to ${phone}`);
            return { success: true, data: response.data };
        } catch (error) {
            // Log failure
            await this.prisma.smsLog.create({
                data: {
                    to: data.to,
                    message: data.message,
                    status: 'FAILED',
                    error: error.message,
                    tenantId: data.tenantId,
                },
            });

            this.logger.error('Failed to send SMS:', error);
            return { success: false, error: error.message };
        }
    }

    async sendBulkSMS(data: {
        recipients: string[];
        message: string;
        tenantId: string;
    }) {
        const results = await Promise.all(
            data.recipients.map(to =>
                this.sendSMS({ to, message: data.message, tenantId: data.tenantId }),
            ),
        );

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        return {
            success: true,
            sent: successCount,
            failed: failureCount,
            total: data.recipients.length,
        };
    }

    async sendHearingReminderSMS(data: {
        to: string;
        clientName: string;
        hearingDate: Date;
        courtName: string;
        caseTitle: string;
        tenantId: string;
    }) {
        const formattedDate = new Intl.DateTimeFormat('ar-SA', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date(data.hearingDate));

        const message = `
تذكير بجلسة قضائية

السيد/ة ${data.clientName}
القضية: ${data.caseTitle}
التاريخ: ${formattedDate}
المحكمة: ${data.courtName}

يرجى الحضور قبل الموعد بـ 15 دقيقة.
        `.trim();

        return this.sendSMS({
            to: data.to,
            message,
            tenantId: data.tenantId,
        });
    }
}
