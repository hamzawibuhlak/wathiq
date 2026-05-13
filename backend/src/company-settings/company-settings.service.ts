import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Single-row settings for the law office.
 * The first record acts as the singleton; missing records auto-seed defaults.
 */
@Injectable()
export class CompanySettingsService {
    constructor(private readonly prisma: PrismaService) { }

    async get() {
        let settings = await this.prisma.companySettings.findFirst();
        if (!settings) {
            settings = await this.prisma.companySettings.create({
                data: { name: 'My Law Office' },
            });
        }
        return settings;
    }

    async update(data: Partial<{
        name: string;
        nameEn: string | null;
        email: string | null;
        phone: string | null;
        address: string | null;
        city: string | null;
        licenseNumber: string | null;
        taxNumber: string | null;
        commercialReg: string | null;
        website: string | null;
        logo: string | null;
        letterheadUrl: string | null;
        smtpHost: string | null;
        smtpPort: number | null;
        smtpUser: string | null;
        smtpPass: string | null;
        smtpFrom: string | null;
        smtpFromName: string | null;
        smtpSecure: boolean;
        smtpEnabled: boolean;
        whatsappAccessToken: string | null;
        whatsappPhoneNumberId: string | null;
        whatsappBusinessId: string | null;
        whatsappWebhookToken: string | null;
        whatsappEnabled: boolean;
    }>) {
        const current = await this.get();
        return this.prisma.companySettings.update({
            where: { id: current.id },
            data,
        });
    }
}
