import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GdmsApiService } from './gdms-api.service';
import * as crypto from 'crypto';

@Injectable()
export class CallCenterSettingsService {
    constructor(
        private prisma: PrismaService,
        private gdmsApi: GdmsApiService,
    ) { }

    // ══════════════════════════════════════════════════════════
    // GET SETTINGS
    // ══════════════════════════════════════════════════════════

    async getSettings(tenantId: string) {
        let settings = await this.prisma.callCenterSettings.findUnique({
            where: { tenantId },
        });

        // auto-create if not exists
        if (!settings) {
            settings = await this.prisma.callCenterSettings.create({
                data: {
                    tenantId,
                    ucmHost: '',
                    gdmsApiKey: '',
                    gdmsApiSecret: '',
                    gdmsUsername: '',
                    gdmsPassword: '',
                },
            });
        }

        // mask secrets
        return {
            ...settings,
            gdmsApiKey: settings.gdmsApiKey ? '••••••••' : '',
            gdmsApiSecret: settings.gdmsApiSecret ? '••••••••' : '',
            gdmsPassword: settings.gdmsPassword ? '••••••••' : '',
        };
    }

    // ══════════════════════════════════════════════════════════
    // UPDATE SETTINGS
    // ══════════════════════════════════════════════════════════

    async updateSettings(tenantId: string, data: any) {
        const updateData: any = { ...data };

        // remove fields that shouldn't be in updateData
        delete updateData.id;
        delete updateData.tenantId;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.tenant;

        // encrypt secrets if changed (not masked)
        const secretFields = ['gdmsApiKey', 'gdmsApiSecret', 'gdmsPassword'];
        for (const field of secretFields) {
            if (data[field] && data[field] !== '••••••••') {
                updateData[field] = this.gdmsApi.encrypt(data[field]);
            } else {
                delete updateData[field];
            }
        }

        await this.prisma.callCenterSettings.upsert({
            where: { tenantId },
            create: { tenantId, ...updateData },
            update: updateData,
        });

        return this.getSettings(tenantId);
    }

    // ══════════════════════════════════════════════════════════
    // TEST CONNECTION
    // ══════════════════════════════════════════════════════════

    async testConnection(tenantId: string) {
        return this.gdmsApi.testConnection(tenantId);
    }

    // ══════════════════════════════════════════════════════════
    // AUTO-ASSIGN EXTENSION TO USER
    // ══════════════════════════════════════════════════════════

    async autoAssignExtension(
        tenantId: string,
        userId: string,
        userName: string,
    ) {
        const settings = await this.prisma.callCenterSettings.findUnique({
            where: { tenantId },
        });

        if (!settings) {
            throw new NotFoundException('إعدادات السنترال غير موجودة');
        }

        // check if user already has an extension
        const existingUserExt = await this.prisma.sipExtension.findUnique({
            where: { userId },
        });
        if (existingUserExt) {
            throw new BadRequestException('هذا المستخدم لديه Extension مسبقاً');
        }

        // find next available extension number
        const existingExtensions = await this.prisma.sipExtension.findMany({
            where: { tenantId },
            select: { extension: true },
        });

        const usedNumbers = existingExtensions.map((e) => parseInt(e.extension));
        let nextExtension = settings.extensionStart;

        while (
            usedNumbers.includes(nextExtension) &&
            nextExtension <= settings.extensionEnd
        ) {
            nextExtension++;
        }

        if (nextExtension > settings.extensionEnd) {
            throw new BadRequestException('لا توجد Extensions متاحة');
        }

        const password =
            settings.defaultPassword || crypto.randomBytes(8).toString('hex');

        // try creating on GDMS if configured
        let gdmsExtensionId: string | undefined;
        if (settings.gdmsDeviceId && settings.gdmsApiKey) {
            try {
                const gdmsResult = await this.gdmsApi.createExtensionOnGdms(
                    tenantId,
                    {
                        extensionNumber: nextExtension.toString(),
                        displayName: userName,
                        password,
                    },
                );
                gdmsExtensionId = gdmsResult.gdmsExtensionId;
            } catch (err) {
                // log but don't block — still create locally
            }
        }

        // save in DB
        const extension = await this.prisma.sipExtension.create({
            data: {
                extension: nextExtension.toString(),
                displayName: userName,
                password: this.gdmsApi.encrypt(password),
                ucmHost: settings.ucmHost,
                ucmPort: settings.ucmPort,
                userId,
                tenantId,
                gdmsExtensionId: gdmsExtensionId || null,
                createdViaGdms: !!gdmsExtensionId,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return extension;
    }

    // ══════════════════════════════════════════════════════════
    // SYNC CALL LOGS
    // ══════════════════════════════════════════════════════════

    async syncCallLogs(tenantId: string) {
        return this.gdmsApi.syncCallLogs(tenantId);
    }
}
