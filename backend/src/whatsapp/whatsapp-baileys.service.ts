import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

// Baileys imports — dynamic to handle missing dependency gracefully
let makeWASocket: any;
let useMultiFileAuthState: any;
let fetchLatestBaileysVersion: any;
let makeCacheableSignalKeyStore: any;
let Browsers: any;
let DisconnectReason: any;

try {
    const baileys = require('@whiskeysockets/baileys');
    makeWASocket = baileys.default || baileys.makeWASocket;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
    makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore;
    Browsers = baileys.Browsers;
    DisconnectReason = baileys.DisconnectReason;
} catch {
    // Baileys not installed — service will be disabled
}

@Injectable()
export class WhatsappBaileysService implements OnModuleInit {
    private readonly logger = new Logger(WhatsappBaileysService.name);
    // tenantId → socket
    private sessions = new Map<string, any>();

    constructor(
        private prisma: PrismaService,
        private wsGateway: WebSocketGatewayService,
    ) { }

    async onModuleInit() {
        if (!makeWASocket) {
            this.logger.warn('Baileys not installed — WhatsApp QR service disabled');
            return;
        }
        // Restore active sessions on startup
        await this.restoreActiveSessions();
    }

    // ── إنشاء أو استعادة Session ─────────────────
    async initSession(tenantId: string) {
        if (!makeWASocket) {
            throw new Error('WhatsApp QR service not available — install @whiskeysockets/baileys');
        }

        // إذا كانت session موجودة بالفعل
        if (this.sessions.has(tenantId)) {
            return { status: 'ALREADY_CONNECTED' };
        }

        // مسار حفظ ملفات الـ Session
        const sessionsBase = process.env.WHATSAPP_SESSIONS_PATH || './whatsapp-sessions';
        const sessionDir = path.join(process.cwd(), sessionsBase, tenantId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        // تحديث حالة الـ DB
        await this.prisma.whatsappSession.upsert({
            where: { tenantId },
            create: { tenantId, status: 'QR_PENDING', sessionPath: sessionDir },
            update: { status: 'QR_PENDING' },
        });

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, this.logger as any),
            },
            browser: Browsers.macOS('Chrome'),
            printQRInTerminal: false,
            logger: { level: 'silent', child: () => ({ level: 'silent', child: () => ({}), info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, trace: () => { }, fatal: () => { } }), info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, trace: () => { }, fatal: () => { } },
        });

        // ── معالجة تحديثات الاتصال ──────────────────
        sock.ev.on('connection.update', async (update: any) => {
            const { qr, connection, lastDisconnect } = update;

            // QR Code — أرسله للـ Frontend
            if (qr) {
                try {
                    const qrImageUrl = await QRCode.toDataURL(qr);
                    this.wsGateway.broadcastWhatsAppQR(tenantId, qrImageUrl);
                    this.logger.log(`QR generated for tenant: ${tenantId}`);
                } catch (err) {
                    this.logger.error('QR generation failed', err);
                }
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason?.loggedOut;

                await this.prisma.whatsappSession.update({
                    where: { tenantId },
                    data: { status: shouldReconnect ? 'RECONNECTING' : 'DISCONNECTED' },
                }).catch(() => { });

                this.sessions.delete(tenantId);
                this.wsGateway.broadcastWhatsAppStatus(tenantId, shouldReconnect ? 'RECONNECTING' : 'DISCONNECTED');

                if (shouldReconnect) {
                    // أعد المحاولة بعد 5 ثواني
                    setTimeout(() => this.initSession(tenantId), 5000);
                }
            }

            if (connection === 'open') {
                const phoneNumber = sock.user?.id?.split(':')[0] || '';
                this.sessions.set(tenantId, sock);

                await this.prisma.whatsappSession.update({
                    where: { tenantId },
                    data: {
                        status: 'CONNECTED',
                        phoneNumber,
                        connectedAt: new Date(),
                        lastSeen: new Date(),
                    },
                });

                this.wsGateway.broadcastWhatsAppStatus(tenantId, 'CONNECTED', phoneNumber);
                this.logger.log(`WhatsApp connected: tenant=${tenantId}, phone=${phoneNumber}`);
            }
        });

        // ── استقبال الرسائل الواردة ──────────────────
        sock.ev.on('messages.upsert', async ({ messages }: any) => {
            for (const msg of messages) {
                if (msg.key.fromMe) continue;
                if (!msg.message) continue;

                const from = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
                const content =
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    '[مرفق]';

                // ابحث عن العميل تلقائياً
                const client = await this.prisma.client.findFirst({
                    where: {
                        tenantId,
                        OR: [
                            { phone: from },
                            { phone: `0${from.slice(-9)}` },
                            { phone: from.replace(/^966/, '0') },
                        ],
                    },
                });

                // احفظ الرسالة
                const dbSession = await this.prisma.whatsappSession.findUnique({
                    where: { tenantId },
                });

                if (dbSession) {
                    await this.prisma.whatsappBaileysMessage.create({
                        data: {
                            waMessageId: msg.key.id,
                            direction: 'INBOUND',
                            status: 'READ',
                            phone: from,
                            content,
                            sentAt: new Date((msg.messageTimestamp as number) * 1000),
                            sessionId: dbSession.id,
                            tenantId,
                            clientId: client?.id,
                        },
                    });
                }

                // أرسل الرسالة للـ Frontend live
                this.wsGateway.broadcastWhatsAppMessage(tenantId, {
                    type: 'WA_QR_MESSAGE_RECEIVED',
                    from,
                    content,
                    clientName: client?.name,
                    clientId: client?.id,
                    timestamp: msg.messageTimestamp,
                });
            }
        });

        sock.ev.on('creds.update', saveCreds);
        return { status: 'QR_PENDING' };
    }

    // ── إرسال رسالة ─────────────────────────────
    async sendMessage(tenantId: string, phone: string, message: string, agentId?: string) {
        const sock = this.sessions.get(tenantId);
        if (!sock) {
            throw new Error('واتساب غير متصل — يرجى مسح الباركود أولاً');
        }

        // تنسيق الرقم
        let formattedPhone: string;
        const cleanPhone = phone.replace(/[\s\-\+]/g, '');
        if (cleanPhone.startsWith('966')) {
            formattedPhone = `${cleanPhone}@s.whatsapp.net`;
        } else if (cleanPhone.startsWith('0')) {
            formattedPhone = `966${cleanPhone.slice(1)}@s.whatsapp.net`;
        } else {
            formattedPhone = `966${cleanPhone}@s.whatsapp.net`;
        }

        await sock.sendMessage(formattedPhone, { text: message });

        // احفظ الرسالة
        const dbSession = await this.prisma.whatsappSession.findUnique({
            where: { tenantId },
        });

        const client = await this.prisma.client.findFirst({
            where: {
                tenantId,
                OR: [
                    { phone: cleanPhone },
                    { phone: `0${cleanPhone.slice(-9)}` },
                ],
            },
        });

        if (dbSession) {
            await this.prisma.whatsappBaileysMessage.create({
                data: {
                    direction: 'OUTBOUND',
                    status: 'SENT',
                    phone: cleanPhone.replace(/^966|^0/, ''),
                    content: message,
                    sentAt: new Date(),
                    sessionId: dbSession.id,
                    tenantId,
                    clientId: client?.id,
                    agentId,
                },
            });
        }

        return { success: true };
    }

    // ── قطع الاتصال ──────────────────────────────
    async disconnect(tenantId: string) {
        const sock = this.sessions.get(tenantId);
        if (sock) {
            try {
                await sock.logout();
            } catch (e) {
                this.logger.warn('Logout error (may already be disconnected)', e);
            }
            this.sessions.delete(tenantId);
        }

        // احذف ملفات الـ Session
        const sessionsBase = process.env.WHATSAPP_SESSIONS_PATH || './whatsapp-sessions';
        const sessionDir = path.join(process.cwd(), sessionsBase, tenantId);
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        }

        await this.prisma.whatsappSession.update({
            where: { tenantId },
            data: {
                status: 'DISCONNECTED',
                phoneNumber: null,
                connectedAt: null,
            },
        }).catch(() => { });

        return { success: true };
    }

    // ── حالة الجلسة ──────────────────────────────
    async getSessionStatus(tenantId: string) {
        const session = await this.prisma.whatsappSession.findUnique({
            where: { tenantId },
        });
        return {
            status: session?.status || 'DISCONNECTED',
            phone: session?.phoneNumber,
            connectedAt: session?.connectedAt,
            isLive: this.sessions.has(tenantId),
        };
    }

    // ── سجل الرسائل ──────────────────────────────
    async getMessages(tenantId: string, filters?: {
        phone?: string;
        clientId?: string;
        page?: number;
    }) {
        const { page = 1 } = filters || {};
        const where: any = { tenantId };
        if (filters?.phone) where.phone = { contains: filters.phone };
        if (filters?.clientId) where.clientId = filters.clientId;

        const [messages, total] = await Promise.all([
            this.prisma.whatsappBaileysMessage.findMany({
                where,
                include: {
                    client: { select: { id: true, name: true, phone: true } },
                },
                orderBy: { sentAt: 'desc' },
                skip: (page - 1) * 30,
                take: 30,
            }),
            this.prisma.whatsappBaileysMessage.count({ where }),
        ]);

        return {
            data: messages,
            meta: { page, total, totalPages: Math.ceil(total / 30) },
        };
    }

    // ── استعادة Sessions عند بدء تشغيل الـ Backend ─
    async restoreActiveSessions() {
        try {
            const connectedSessions = await this.prisma.whatsappSession.findMany({
                where: { status: { in: ['CONNECTED', 'RECONNECTING'] } },
            });

            for (const session of connectedSessions) {
                this.logger.log(`Restoring WA session for tenant: ${session.tenantId}`);
                await this.initSession(session.tenantId).catch((err) => {
                    this.logger.error(`Failed to restore session: ${session.tenantId}`, err);
                });
            }
        } catch (err) {
            this.logger.error('Failed to restore WA sessions', err);
        }
    }
}
