import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class SipExtensionService {
    private encryptionKey: string;

    constructor(private prisma: PrismaService) {
        this.encryptionKey = process.env.SIP_PASSWORD_ENCRYPTION_KEY || 'watheeq-sip-default-key-32chars!';
    }

    // تشفير SIP Password بـ AES (قابل للفك لأن JsSIP يحتاج plain password)
    private encrypt(text: string): string {
        return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
    }

    private decrypt(cipherText: string): string {
        const bytes = CryptoJS.AES.decrypt(cipherText, this.encryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    async getExtensions(tenantId: string) {
        return this.prisma.sipExtension.findMany({
            where: { tenantId },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
            },
        });
    }

    async assignExtension(tenantId: string, data: {
        userId: string;
        extension: string;
        password: string;
        ucmHost: string;
        ucmPort?: number;
        displayName: string;
    }) {
        // تحقق من عدم التكرار
        const existing = await this.prisma.sipExtension.findFirst({
            where: { tenantId, extension: data.extension },
        });
        if (existing) {
            throw new BadRequestException(`الـ Extension ${data.extension} مستخدم مسبقاً`);
        }

        // تحقق إن المستخدم ما عنده extension
        const userExt = await this.prisma.sipExtension.findUnique({
            where: { userId: data.userId },
        });
        if (userExt) {
            throw new BadRequestException('هذا المستخدم لديه Extension مسبقاً');
        }

        // تشفير الـ SIP Password بـ AES
        const encryptedPassword = this.encrypt(data.password);

        return this.prisma.sipExtension.create({
            data: {
                extension: data.extension,
                displayName: data.displayName,
                password: encryptedPassword,
                ucmHost: data.ucmHost,
                ucmPort: data.ucmPort || 8089,
                userId: data.userId,
                tenantId,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async updateExtension(id: string, tenantId: string, data: {
        extension?: string;
        displayName?: string;
        password?: string;
        ucmHost?: string;
        ucmPort?: number;
        isActive?: boolean;
    }) {
        const ext = await this.prisma.sipExtension.findFirst({ where: { id, tenantId } });
        if (!ext) throw new NotFoundException('Extension غير موجود');

        const updateData: any = {};
        if (data.extension) updateData.extension = data.extension;
        if (data.displayName) updateData.displayName = data.displayName;
        if (data.password) updateData.password = this.encrypt(data.password);
        if (data.ucmHost) updateData.ucmHost = data.ucmHost;
        if (data.ucmPort) updateData.ucmPort = data.ucmPort;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        return this.prisma.sipExtension.update({
            where: { id },
            data: updateData,
        });
    }

    // يُرجع بيانات الاتصال للـ Frontend مع password مفكوك
    async getExtensionForUser(userId: string, tenantId: string) {
        const ext = await this.prisma.sipExtension.findFirst({
            where: { userId, tenantId, isActive: true },
        });
        if (!ext) return null;

        return {
            id: ext.id,
            extension: ext.extension,
            displayName: ext.displayName,
            sipPassword: this.decrypt(ext.password),
            ucmHost: ext.ucmHost,
            ucmPort: ext.ucmPort,
            isActive: ext.isActive,
            userId: ext.userId,
            tenantId: ext.tenantId,
            wsUrl: `wss://${ext.ucmHost}:${ext.ucmPort}/ws`,
        };
    }

    async deleteExtension(id: string, tenantId: string) {
        const ext = await this.prisma.sipExtension.findFirst({ where: { id, tenantId } });
        if (!ext) throw new NotFoundException('Extension غير موجود');
        return this.prisma.sipExtension.delete({ where: { id } });
    }
}
