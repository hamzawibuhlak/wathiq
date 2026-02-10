import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

interface CallOptions {
    to: string;
    from?: string;
    record?: boolean;
    statusCallback?: string;
}

@Injectable()
export class CallsService {
    private readonly logger = new Logger(CallsService.name);
    private twilioClient: any = null;
    private twilioNumber: string;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {
        this.twilioNumber = this.config.get('TWILIO_PHONE_NUMBER') || '+966500000000';
        this.initTwilio();
    }

    private initTwilio() {
        try {
            const accountSid = this.config.get('TWILIO_ACCOUNT_SID');
            const authToken = this.config.get('TWILIO_AUTH_TOKEN');

            if (accountSid && authToken) {
                // Dynamic import for optional dependency
                const twilio = require('twilio');
                this.twilioClient = twilio(accountSid, authToken);
                this.logger.log('Twilio client initialized successfully');
            } else {
                this.logger.warn('Twilio credentials not configured - calls will be logged only');
            }
        } catch (error) {
            this.logger.warn(`Twilio not available: ${error.message}`);
        }
    }

    /**
     * Initiate an outbound call
     */
    async initiateCall(
        userId: string,
        tenantId: string,
        options: CallOptions,
    ) {
        try {
            // Validate phone number
            if (!this.isValidSaudiNumber(options.to)) {
                throw new BadRequestException('رقم الهاتف غير صحيح');
            }

            let callSid: string | null = null;
            let callStatus = 'QUEUED';

            // If Twilio is configured, make real call
            if (this.twilioClient) {
                const call = await this.twilioClient.calls.create({
                    to: options.to,
                    from: options.from || this.twilioNumber,
                    url: `${this.config.get('API_URL')}/webhooks/twilio/voice`,
                    statusCallback: options.statusCallback || `${this.config.get('API_URL')}/webhooks/twilio/status`,
                    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                    record: options.record !== false,
                    recordingStatusCallback: `${this.config.get('API_URL')}/webhooks/twilio/recording`,
                });
                callSid = call.sid;
                callStatus = call.status;
            }

            // Save call to database
            const callRecord = await this.prisma.call.create({
                data: {
                    twilioCallSid: callSid,
                    direction: 'OUTBOUND',
                    from: options.from || this.twilioNumber,
                    to: options.to,
                    status: callStatus as any,
                    userId,
                    tenantId,
                },
            });

            return {
                callId: callRecord.id,
                twilioSid: callSid,
                status: callRecord.status,
                to: callRecord.to,
                from: callRecord.from,
            };
        } catch (error) {
            this.logger.error(`Failed to initiate call: ${error.message}`);
            throw new BadRequestException(`فشل في إجراء المكالمة: ${error.message}`);
        }
    }

    /**
     * Handle incoming call
     */
    async handleIncomingCall(callSid: string, from: string, to: string) {
        // Find user by phone number
        const user = await this.prisma.user.findFirst({
            where: { phone: from },
            include: { tenant: true },
        });

        // Create call record
        const call = await this.prisma.call.create({
            data: {
                twilioCallSid: callSid,
                direction: 'INBOUND',
                from,
                to,
                status: 'RINGING',
                userId: user?.id,
                tenantId: user?.tenantId || '',
            },
        });

        return call;
    }

    /**
     * Update call status
     */
    async updateCallStatus(
        callSid: string,
        status: string,
        duration?: number,
    ) {
        const statusMap: Record<string, string> = {
            'queued': 'QUEUED',
            'ringing': 'RINGING',
            'in-progress': 'IN_PROGRESS',
            'completed': 'COMPLETED',
            'busy': 'BUSY',
            'no-answer': 'NO_ANSWER',
            'canceled': 'CANCELED',
            'failed': 'FAILED',
        };

        const mappedStatus = statusMap[status.toLowerCase()] || status.toUpperCase();

        return this.prisma.call.updateMany({
            where: { twilioCallSid: callSid },
            data: {
                status: mappedStatus as any,
                duration: duration || undefined,
                endedAt: ['COMPLETED', 'BUSY', 'NO_ANSWER', 'CANCELED', 'FAILED'].includes(mappedStatus)
                    ? new Date()
                    : undefined,
            },
        });
    }

    /**
     * Get call history
     */
    async getCallHistory(
        tenantId: string,
        filters?: {
            userId?: string;
            direction?: 'INBOUND' | 'OUTBOUND';
            startDate?: Date;
            endDate?: Date;
            limit?: number;
        },
    ) {
        const where: any = { tenantId };

        if (filters?.userId) where.userId = filters.userId;
        if (filters?.direction) where.direction = filters.direction;
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {
                ...(filters.startDate && { gte: filters.startDate }),
                ...(filters.endDate && { lte: filters.endDate }),
            };
        }

        return this.prisma.call.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                recording: true,
            },
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 50,
        });
    }

    /**
     * Get call recording URL
     */
    async getRecordingUrl(callId: string): Promise<string | null> {
        const call = await this.prisma.call.findUnique({
            where: { id: callId },
            include: { recording: true },
        });

        if (!call?.recording) return null;

        return call.recording.recordingUrl;
    }

    /**
     * Save call recording
     */
    async saveCallRecording(
        callSid: string,
        recordingSid: string,
        recordingUrl: string,
        duration: number,
    ) {
        const call = await this.prisma.call.findFirst({
            where: { twilioCallSid: callSid },
        });

        if (!call) return null;

        return this.prisma.callRecording.create({
            data: {
                callId: call.id,
                twilioRecordingSid: recordingSid,
                recordingUrl,
                duration,
            },
        });
    }

    /**
     * Generate TwiML for IVR
     */
    generateIVRTwiML(language: 'ar' | 'en' = 'ar'): string {
        const messages = {
            ar: {
                welcome: 'مرحباً بك في وثيق، نظام إدارة مكاتب المحاماة',
                menu: 'للتحدث مع قسم الاستشارات اضغط 1، للتحدث مع قسم القضايا اضغط 2، للتحدث مع المحاسبة اضغط 3',
                invalidOption: 'الخيار غير صحيح، يرجى المحاولة مرة أخرى',
            },
            en: {
                welcome: 'Welcome to Watheeq, Law Firm Management System',
                menu: 'Press 1 for Consultations, Press 2 for Cases, Press 3 for Accounting',
                invalidOption: 'Invalid option, please try again',
            },
        };

        const msg = messages[language];

        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Zeina" language="ar-SA">${msg.welcome}</Say>
  <Gather numDigits="1" action="/webhooks/twilio/ivr-selection" method="POST">
    <Say voice="Polly.Zeina" language="ar-SA">${msg.menu}</Say>
  </Gather>
  <Say voice="Polly.Zeina" language="ar-SA">${msg.invalidOption}</Say>
  <Redirect>/webhooks/twilio/voice</Redirect>
</Response>`;
    }

    /**
     * Handle IVR selection
     */
    generateIVRSelection(digit: string): string {
        const departments: Record<string, { name: string; number: string }> = {
            '1': { name: 'الاستشارات', number: '+966501234567' },
            '2': { name: 'القضايا', number: '+966501234568' },
            '3': { name: 'المحاسبة', number: '+966501234569' },
        };

        const dept = departments[digit];

        if (!dept) {
            return this.generateIVRTwiML();
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Zeina" language="ar-SA">سيتم تحويلك إلى قسم ${dept.name}</Say>
  <Dial>${dept.number}</Dial>
</Response>`;
    }

    /**
     * Get call analytics
     */
    async getCallAnalytics(tenantId: string, period: 'day' | 'week' | 'month') {
        const now = new Date();
        const startDate = new Date();

        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
        }

        const [
            totalCalls,
            inboundCalls,
            outboundCalls,
            answeredCalls,
            missedCalls,
            avgDuration,
        ] = await Promise.all([
            this.prisma.call.count({
                where: { tenantId, createdAt: { gte: startDate } },
            }),
            this.prisma.call.count({
                where: { tenantId, direction: 'INBOUND', createdAt: { gte: startDate } },
            }),
            this.prisma.call.count({
                where: { tenantId, direction: 'OUTBOUND', createdAt: { gte: startDate } },
            }),
            this.prisma.call.count({
                where: { tenantId, status: 'COMPLETED', createdAt: { gte: startDate } },
            }),
            this.prisma.call.count({
                where: { tenantId, status: 'NO_ANSWER', createdAt: { gte: startDate } },
            }),
            this.prisma.call.aggregate({
                where: { tenantId, status: 'COMPLETED', createdAt: { gte: startDate } },
                _avg: { duration: true },
            }),
        ]);

        return {
            period,
            totalCalls,
            inboundCalls,
            outboundCalls,
            answeredCalls,
            missedCalls,
            avgDuration: Math.round(avgDuration._avg.duration || 0),
            answerRate: totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0,
        };
    }

    // Helper methods
    private isValidSaudiNumber(phone: string): boolean {
        const saudiRegex = /^(\+966|966|0)?5\d{8}$/;
        return saudiRegex.test(phone.replace(/\s/g, ''));
    }
}
