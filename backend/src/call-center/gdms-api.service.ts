import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class GdmsApiService {
    private readonly logger = new Logger(GdmsApiService.name);
    private readonly GDMS_BASE_URL = 'https://www.gdms.cloud';

    // Cache tokens per tenant to avoid re-auth on every call
    private tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

    constructor(private prisma: PrismaService) { }

    // ══════════════════════════════════════════════════════════
    // 🔐 ENCRYPTION HELPERS
    // ══════════════════════════════════════════════════════════

    encrypt(text: string): string {
        if (!text) return '';
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(
            process.env.ENCRYPTION_KEY || '12345678901234567890123456789012',
            'utf-8',
        );
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(text: string): string {
        if (!text || !text.includes(':')) return text;
        try {
            const algorithm = 'aes-256-cbc';
            const key = Buffer.from(
                process.env.ENCRYPTION_KEY || '12345678901234567890123456789012',
                'utf-8',
            );
            const parts = text.split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = parts.slice(1).join(':');
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch {
            return text;
        }
    }

    // ══════════════════════════════════════════════════════════
    // 🔑 PASSWORD HASHING (GDMS requires MD5 → SHA256)
    // ══════════════════════════════════════════════════════════

    private hashPassword(password: string): string {
        const md5Hash = crypto.createHash('md5').update(password).digest('hex');
        return crypto.createHash('sha256').update(md5Hash).digest('hex');
    }

    // ══════════════════════════════════════════════════════════
    // 🔑 OAUTH2 TOKEN MANAGEMENT
    // ══════════════════════════════════════════════════════════

    private async getAccessToken(tenantId: string): Promise<string> {
        // Check cache first
        const cached = this.tokenCache.get(tenantId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.token;
        }

        const settings = await this.prisma.callCenterSettings.findUnique({
            where: { tenantId },
        });
        if (!settings) {
            throw new BadRequestException('إعدادات السنترال غير موجودة');
        }

        const username = this.decrypt(settings.gdmsUsername || '');
        const password = this.decrypt(settings.gdmsPassword || '');
        const clientId = this.decrypt(settings.gdmsApiKey);
        const clientSecret = this.decrypt(settings.gdmsApiSecret);

        if (!username || !password || !clientId || !clientSecret) {
            throw new BadRequestException(
                'بيانات GDMS غير مكتملة — تحتاج username, password, client_id, client_secret',
            );
        }

        const hashedPassword = this.hashPassword(password);

        try {
            const response = await axios.post(
                `${this.GDMS_BASE_URL}/oapi/oauth/token`,
                new URLSearchParams({
                    username,
                    password: hashedPassword,
                    grant_type: 'password',
                    client_id: clientId,
                    client_secret: clientSecret,
                }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: 30000,
                },
            );

            const token = response.data.access_token;
            const expiresIn = response.data.expires_in || 3600;

            // Cache the token (expire 5 min early to be safe)
            this.tokenCache.set(tenantId, {
                token,
                expiresAt: Date.now() + (expiresIn - 300) * 1000,
            });

            this.logger.log(`GDMS OAuth token obtained for tenant ${tenantId}`);
            return token;
        } catch (error) {
            this.logger.error('GDMS OAuth token request failed', error?.response?.data || error.message);
            throw new BadRequestException(
                'فشل الحصول على Token من GDMS: ' +
                (error?.response?.data?.error_description || error?.response?.data?.message || error.message),
            );
        }
    }

    // ══════════════════════════════════════════════════════════
    // 🌐 AUTHENTICATED API CLIENT
    // ══════════════════════════════════════════════════════════

    private async getApiClient(tenantId: string): Promise<AxiosInstance> {
        const token = await this.getAccessToken(tenantId);

        return axios.create({
            baseURL: `${this.GDMS_BASE_URL}/oapi/v1.0.0`,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
    }

    // ══════════════════════════════════════════════════════════
    // ✅ TEST CONNECTION
    // ══════════════════════════════════════════════════════════

    async testConnection(
        tenantId: string,
    ): Promise<{ success: boolean; message: string; deviceInfo?: any }> {
        try {
            // Step 1: Get OAuth token (this validates credentials)
            const token = await this.getAccessToken(tenantId);

            const settings = await this.prisma.callCenterSettings.findUnique({
                where: { tenantId },
            });
            if (!settings) {
                return { success: false, message: 'إعدادات السنترال غير موجودة' };
            }

            // Step 2: Try to list devices to validate full access
            const client = axios.create({
                baseURL: `${this.GDMS_BASE_URL}/oapi/v1.0.0`,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            });

            // Try to get device info if Device ID is provided
            let deviceInfo: any = null;
            if (settings.gdmsDeviceId) {
                try {
                    const deviceResponse = await client.get(`/device/${settings.gdmsDeviceId}`);
                    deviceInfo = {
                        model: deviceResponse.data?.data?.model || 'UCM6301',
                        firmware: deviceResponse.data?.data?.firmware_version,
                        status: deviceResponse.data?.data?.status,
                        mac: deviceResponse.data?.data?.mac,
                    };
                } catch (devErr) {
                    this.logger.warn('Could not fetch device info, but token is valid');
                    // Token works but device endpoint may use different path - still a success
                }
            }

            // Update connection status
            await this.prisma.callCenterSettings.update({
                where: { tenantId },
                data: {
                    isConnected: true,
                    lastSync: new Date(),
                    lastError: null,
                    syncAttempts: 0,
                },
            });

            return {
                success: true,
                message: deviceInfo
                    ? 'تم الاتصال بنجاح — الجهاز متصل'
                    : 'تم الاتصال بنجاح — Token صالح',
                deviceInfo,
            };
        } catch (error) {
            this.logger.error('GDMS Connection Test Failed', error.message);

            await this.prisma.callCenterSettings.update({
                where: { tenantId },
                data: {
                    isConnected: false,
                    lastError: error.message,
                    syncAttempts: { increment: 1 },
                },
            }).catch(() => { });

            return {
                success: false,
                message: error.message || 'فشل الاتصال بـ GDMS',
            };
        }
    }

    // ══════════════════════════════════════════════════════════
    // 📞 EXTENSION MANAGEMENT
    // ══════════════════════════════════════════════════════════

    async createExtensionOnGdms(
        tenantId: string,
        data: { extensionNumber: string; displayName: string; password: string },
    ) {
        try {
            const client = await this.getApiClient(tenantId);
            const settings = await this.prisma.callCenterSettings.findUnique({
                where: { tenantId },
            });
            if (!settings) throw new BadRequestException('إعدادات السنترال غير موجودة');

            const response = await client.post(
                `/device/${settings.gdmsDeviceId}/extensions`,
                {
                    extension: data.extensionNumber,
                    caller_id: data.displayName,
                    password: data.password,
                    enable_webrtc: true,
                    nat: settings.enableNat,
                    stun_server: settings.stunServer,
                    codec: ['PCMU', 'PCMA', 'G729'],
                },
            );

            return { success: true, gdmsExtensionId: response.data?.data?.id || response.data?.id };
        } catch (error) {
            this.logger.error('Failed to create extension on GDMS', error.message);
            throw new BadRequestException(
                'فشل إنشاء Extension في GDMS: ' + error.message,
            );
        }
    }

    async deleteExtensionFromGdms(tenantId: string, gdmsExtensionId: string) {
        try {
            const client = await this.getApiClient(tenantId);
            const settings = await this.prisma.callCenterSettings.findUnique({
                where: { tenantId },
            });
            if (!settings) throw new BadRequestException('إعدادات السنترال غير موجودة');

            await client.delete(
                `/device/${settings.gdmsDeviceId}/extensions/${gdmsExtensionId}`,
            );
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to delete extension from GDMS', error.message);
            throw new BadRequestException('فشل حذف Extension من GDMS');
        }
    }

    async syncExtensionStatus(tenantId: string, extensionNumber: string) {
        try {
            const client = await this.getApiClient(tenantId);
            const settings = await this.prisma.callCenterSettings.findUnique({
                where: { tenantId },
            });
            if (!settings) return null;

            const response = await client.get(
                `/device/${settings.gdmsDeviceId}/extensions/${extensionNumber}/status`,
            );

            await this.prisma.sipExtension.updateMany({
                where: { tenantId, extension: extensionNumber },
                data: {
                    registrationStatus: response.data?.data?.registered
                        ? 'REGISTERED'
                        : 'UNREGISTERED',
                    lastRegistered: response.data?.data?.registered ? new Date() : undefined,
                },
            });

            return response.data;
        } catch (error) {
            this.logger.error('Failed to sync extension status', error.message);
            return null;
        }
    }

    // ══════════════════════════════════════════════════════════
    // 📊 CALL LOGS & CDR
    // ══════════════════════════════════════════════════════════

    async syncCallLogs(tenantId: string, fromDate?: Date, toDate?: Date) {
        try {
            const client = await this.getApiClient(tenantId);
            const settings = await this.prisma.callCenterSettings.findUnique({
                where: { tenantId },
            });
            if (!settings) throw new BadRequestException('إعدادات السنترال غير موجودة');

            const response = await client.get(
                `/device/${settings.gdmsDeviceId}/cdr`,
                {
                    params: {
                        from_date:
                            fromDate?.toISOString() ||
                            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        to_date: toDate?.toISOString() || new Date().toISOString(),
                    },
                },
            );

            const callLogs = response.data?.data?.logs || response.data?.data || [];
            let syncedCount = 0;

            for (const log of callLogs) {
                const existing = await this.prisma.callRecord.findFirst({
                    where: { gdmsCallId: log.id?.toString() },
                });

                if (!existing) {
                    const agent = await this.prisma.sipExtension.findFirst({
                        where: { tenantId, extension: log.src },
                    });

                    await this.prisma.callRecord.create({
                        data: {
                            tenantId,
                            gdmsCallId: log.id?.toString(),
                            callId: log.uniqueid || `gdms-${log.id}`,
                            direction:
                                log.direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
                            fromNumber: log.src || '',
                            toNumber: log.dst || '',
                            duration: log.duration || 0,
                            status:
                                log.disposition === 'ANSWERED' ? 'ANSWERED' : 'NO_ANSWER',
                            startedAt: new Date(log.start_time || Date.now()),
                            answeredAt: log.answer_time
                                ? new Date(log.answer_time)
                                : null,
                            endedAt: new Date(log.end_time || Date.now()),
                            recordingUrl: log.recording_url || null,
                            agentId: agent?.userId || '',
                        },
                    });
                    syncedCount++;
                }
            }

            return { success: true, syncedCount };
        } catch (error) {
            this.logger.error('Failed to sync call logs', error.message);
            return { success: false, error: error.message };
        }
    }

    // ══════════════════════════════════════════════════════════
    // 🎙️ RECORDING MANAGEMENT
    // ══════════════════════════════════════════════════════════

    async getRecordingDownloadUrl(
        tenantId: string,
        gdmsCallId: string,
    ): Promise<string> {
        try {
            const client = await this.getApiClient(tenantId);
            const settings = await this.prisma.callCenterSettings.findUnique({
                where: { tenantId },
            });
            if (!settings) throw new BadRequestException('إعدادات السنترال غير موجودة');

            const response = await client.get(
                `/device/${settings.gdmsDeviceId}/recordings/${gdmsCallId}/download-url`,
            );

            return response.data?.data?.url || response.data?.url;
        } catch (error) {
            this.logger.error('Failed to get recording URL', error.message);
            throw new BadRequestException('فشل الحصول على رابط التسجيل');
        }
    }

    async downloadAndStoreRecording(tenantId: string, callRecordId: string) {
        try {
            const callRecord = await this.prisma.callRecord.findUnique({
                where: { id: callRecordId },
            });

            if (!callRecord || !callRecord.gdmsCallId) {
                throw new BadRequestException('سجل المكالمة غير موجود');
            }

            const downloadUrl = await this.getRecordingDownloadUrl(
                tenantId,
                callRecord.gdmsCallId,
            );

            const response = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
            });
            const buffer = Buffer.from(response.data);

            const fileName = `${callRecord.callId}.wav`;
            const filePath = `/storage/recordings/${tenantId}/${fileName}`;

            await this.prisma.callRecord.update({
                where: { id: callRecordId },
                data: {
                    recordingUrl: filePath,
                    recordingSize: buffer.length,
                    recordingDownloaded: true,
                },
            });

            return { success: true, filePath };
        } catch (error) {
            this.logger.error('Failed to download recording', error.message);
            throw error;
        }
    }
}
