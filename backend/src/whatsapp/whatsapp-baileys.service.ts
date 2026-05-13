import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

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
    private socket: any = null;

    constructor(
        private prisma: PrismaService,
        private wsGateway: WebSocketGatewayService,
    ) { }

    async onModuleInit() {
        if (!makeWASocket) {
            this.logger.warn('Baileys not installed — WhatsApp QR service disabled');
            return;
        }
        await this.restoreActiveSessions();
    }

    private async getOrCreateSessionRow() {
        let session = await this.prisma.whatsappSession.findFirst();
        if (!session) {
            session = await this.prisma.whatsappSession.create({
                data: { status: 'DISCONNECTED' } });
        }
        return session;
    }

    async initSession() {
        if (!makeWASocket) {
            throw new Error('WhatsApp QR service not available — install @whiskeysockets/baileys');
        }

        if (this.socket) {
            return { status: 'ALREADY_CONNECTED' };
        }

        const sessionsBase = process.env.WHATSAPP_SESSIONS_PATH || './whatsapp-sessions';
        const sessionDir = path.join(process.cwd(), sessionsBase);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        const row = await this.getOrCreateSessionRow();
        await this.prisma.whatsappSession.update({
            where: { id: row.id },
            data: { status: 'QR_PENDING', sessionPath: sessionDir } });

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, this.logger as any) },
            browser: Browsers.macOS('Chrome'),
            printQRInTerminal: false,
            logger: { level: 'silent', child: () => ({ level: 'silent', child: () => ({}), info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, trace: () => { }, fatal: () => { } }), info: () => { }, warn: () => { }, error: () => { }, debug: () => { }, trace: () => { }, fatal: () => { } } });

        sock.ev.on('connection.update', async (update: any) => {
            const { qr, connection, lastDisconnect } = update;

            if (qr) {
                try {
                    const qrImageUrl = await QRCode.toDataURL(qr);
                    this.wsGateway.broadcastWhatsAppQR(qrImageUrl);
                    this.logger.log('QR generated');
                } catch (err) {
                    this.logger.error('QR generation failed', err);
                }
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason?.loggedOut;

                await this.prisma.whatsappSession.update({
                    where: { id: row.id },
                    data: { status: shouldReconnect ? 'RECONNECTING' : 'DISCONNECTED' } }).catch(() => { });

                this.socket = null;
                this.wsGateway.broadcastWhatsAppStatus(shouldReconnect ? 'RECONNECTING' : 'DISCONNECTED');

                if (shouldReconnect) {
                    setTimeout(() => this.initSession(), 5000);
                }
            }

            if (connection === 'open') {
                const phoneNumber = sock.user?.id?.split(':')[0] || '';
                this.socket = sock;

                await this.prisma.whatsappSession.update({
                    where: { id: row.id },
                    data: {
                        status: 'CONNECTED',
                        phoneNumber,
                        connectedAt: new Date(),
                        lastSeen: new Date() } });

                this.wsGateway.broadcastWhatsAppStatus('CONNECTED', phoneNumber);
                this.logger.log(`WhatsApp connected: phone=${phoneNumber}`);
            }
        });

        sock.ev.on('messages.upsert', async ({ messages }: any) => {
            for (const msg of messages) {
                if (msg.key.fromMe) continue;
                if (!msg.message) continue;

                const from = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
                const content =
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    '[مرفق]';

                const client = await this.prisma.client.findFirst({
                    where: {
                        OR: [
                            { phone: from },
                            { phone: `0${from.slice(-9)}` },
                            { phone: from.replace(/^966/, '0') },
                        ] } });

                const dbSession = await this.prisma.whatsappSession.findFirst();

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
                            clientId: client?.id } });
                }

                this.wsGateway.broadcastWhatsAppMessage({
                    type: 'WA_QR_MESSAGE_RECEIVED',
                    from,
                    content,
                    clientName: client?.name,
                    clientId: client?.id,
                    timestamp: msg.messageTimestamp });
            }
        });

        sock.ev.on('creds.update', saveCreds);
        return { status: 'QR_PENDING' };
    }

    async sendMessage(phone: string, message: string, agentId?: string) {
        const sock = this.socket;
        if (!sock) {
            throw new Error('واتساب غير متصل — يرجى مسح الباركود أولاً');
        }

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

        const dbSession = await this.prisma.whatsappSession.findFirst();

        const client = await this.prisma.client.findFirst({
            where: {
                OR: [
                    { phone: cleanPhone },
                    { phone: `0${cleanPhone.slice(-9)}` },
                ] } });

        if (dbSession) {
            await this.prisma.whatsappBaileysMessage.create({
                data: {
                    direction: 'OUTBOUND',
                    status: 'SENT',
                    phone: cleanPhone.replace(/^966|^0/, ''),
                    content: message,
                    sentAt: new Date(),
                    sessionId: dbSession.id,
                    clientId: client?.id,
                    agentId } });
        }

        return { success: true };
    }

    async disconnect() {
        const sock = this.socket;
        if (sock) {
            try {
                await sock.logout();
            } catch (e) {
                this.logger.warn('Logout error (may already be disconnected)', e);
            }
            this.socket = null;
        }

        const sessionsBase = process.env.WHATSAPP_SESSIONS_PATH || './whatsapp-sessions';
        const sessionDir = path.join(process.cwd(), sessionsBase);
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        }

        const row = await this.prisma.whatsappSession.findFirst();
        if (row) {
            await this.prisma.whatsappSession.update({
                where: { id: row.id },
                data: {
                    status: 'DISCONNECTED',
                    phoneNumber: null,
                    connectedAt: null } }).catch(() => { });
        }

        return { success: true };
    }

    async getSessionStatus() {
        const session = await this.prisma.whatsappSession.findFirst();
        return {
            status: session?.status || 'DISCONNECTED',
            phone: session?.phoneNumber,
            connectedAt: session?.connectedAt,
            isLive: !!this.socket };
    }

    async getMessages(filters?: {
        phone?: string;
        clientId?: string;
        page?: number;
    }) {
        const { page = 1 } = filters || {};
        const where: any = {};
        if (filters?.phone) where.phone = { contains: filters.phone };
        if (filters?.clientId) where.clientId = filters.clientId;

        const [messages, total] = await Promise.all([
            this.prisma.whatsappBaileysMessage.findMany({
                where,
                include: {
                    client: { select: { id: true, name: true, phone: true } } },
                orderBy: { sentAt: 'desc' },
                skip: (page - 1) * 30,
                take: 30 }),
            this.prisma.whatsappBaileysMessage.count({ where }),
        ]);

        return {
            data: messages,
            meta: { page, total, totalPages: Math.ceil(total / 30) } };
    }

    async restoreActiveSessions() {
        try {
            const session = await this.prisma.whatsappSession.findFirst({
                where: { status: { in: ['CONNECTED', 'RECONNECTING'] } } });

            if (session) {
                this.logger.log(`Restoring WA session: ${session.id}`);
                await this.initSession().catch((err) => {
                    this.logger.error(`Failed to restore session: ${session.id}`, err);
                });
            }
        } catch (err) {
            this.logger.error('Failed to restore WA sessions', err);
        }
    }
}
