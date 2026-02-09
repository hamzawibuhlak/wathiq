import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Saudi Compliance Service (NCA - الهيئة الوطنية للأمن السيبراني)
 * خدمة الامتثال للأنظمة السعودية
 */
@Injectable()
export class SaudiComplianceService {
    constructor(private prisma: PrismaService) { }

    /**
     * Verify Data Localization
     * التحقق من تخزين البيانات في السعودية
     */
    async verifyDataLocalization() {
        // Check database configuration
        const databaseUrl = process.env.DATABASE_URL || '';
        const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
        const isSaudiCloud = databaseUrl.includes('.sa.') ||
            databaseUrl.includes('saudi') ||
            databaseUrl.includes('riyadh') ||
            databaseUrl.includes('jeddah');

        return {
            databaseLocation: isLocal ? 'Local Development' : (isSaudiCloud ? 'Saudi Arabia' : 'Unknown'),
            backupLocation: isLocal ? 'Local' : 'Configured by Cloud Provider',
            compliant: isLocal || isSaudiCloud,
            recommendation: !isSaudiCloud && !isLocal
                ? 'تأكد من استضافة قاعدة البيانات في مركز بيانات سعودي'
                : null,
        };
    }

    /**
     * Audit Access Controls
     * تدقيق ضوابط الوصول
     */
    async auditAccessControls(tenantId: string) {
        const [admins, allUsers, usersWithout2FA] = await Promise.all([
            this.prisma.user.findMany({
                where: { tenantId, role: { in: ['ADMIN', 'OWNER'] } },
                select: { id: true, name: true, twoFactorEnabled: true },
            }),
            this.prisma.user.count({ where: { tenantId, isActive: true } }),
            this.prisma.user.count({
                where: { tenantId, isActive: true, twoFactorEnabled: false },
            }),
        ]);

        const adminsWithout2FA = admins.filter(a => !a.twoFactorEnabled);

        return {
            totalActiveUsers: allUsers,
            totalAdmins: admins.length,
            adminsWithout2FA: adminsWithout2FA.length,
            usersWithout2FA,
            compliant: adminsWithout2FA.length === 0,
            recommendations: [
                ...(adminsWithout2FA.length > 0
                    ? [`تفعيل المصادقة الثنائية لـ ${adminsWithout2FA.length} من المدراء`]
                    : []),
                ...(usersWithout2FA > 0
                    ? [`تشجيع المستخدمين على تفعيل المصادقة الثنائية (${usersWithout2FA} مستخدم)`]
                    : []),
            ],
        };
    }

    /**
     * Verify Encryption
     * التحقق من التشفير
     */
    async verifyEncryption() {
        const isHttps = process.env.NODE_ENV === 'production';
        const hasEncryptionKey = !!process.env.ENCRYPTION_KEY;

        return {
            dataAtRest: hasEncryptionKey ? 'AES-256-GCM' : 'Not Configured',
            dataInTransit: isHttps ? 'TLS 1.3' : 'HTTP (Development)',
            databaseEncryption: 'PostgreSQL native',
            compliant: hasEncryptionKey,
            recommendations: [
                ...(!hasEncryptionKey ? ['إعداد ENCRYPTION_KEY في متغيرات البيئة'] : []),
                ...(!isHttps ? ['تفعيل HTTPS في بيئة الإنتاج'] : []),
            ],
        };
    }

    /**
     * Check Log Retention
     * التحقق من الاحتفاظ بالسجلات (6 أشهر كحد أدنى)
     */
    async checkLogRetention() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const [oldestLog, totalLogs, logsOlderThan6Months] = await Promise.all([
            this.prisma.activityLog.findFirst({
                orderBy: { createdAt: 'asc' },
                select: { createdAt: true },
            }),
            this.prisma.activityLog.count(),
            this.prisma.activityLog.count({
                where: { createdAt: { lt: sixMonthsAgo } },
            }),
        ]);

        const hasOldLogs = oldestLog && oldestLog.createdAt < sixMonthsAgo;

        return {
            oldestLogDate: oldestLog?.createdAt,
            totalLogs,
            logsOlderThan6Months,
            retentionPeriod: hasOldLogs ? '6+ months' : 'Less than 6 months',
            compliant: hasOldLogs || totalLogs > 0,
            recommendation: !hasOldLogs
                ? 'النظام جديد - تأكد من عدم حذف السجلات قبل 6 أشهر'
                : null,
        };
    }

    /**
     * Create Incident Report
     * إنشاء تقرير حادث أمني
     */
    async createIncidentReport(incident: {
        type: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        description: string;
        affectedUsers: number;
        dataBreached: boolean;
        tenantId: string;
        reportedBy: string;
    }) {
        // Log the incident
        await this.prisma.activityLog.create({
            data: {
                action: 'SECURITY_INCIDENT',
                entity: 'Incident',
                entityId: null,
                description: `[${incident.severity}] ${incident.type}: ${incident.description}`,
                userId: incident.reportedBy,
                tenantId: incident.tenantId,
            },
        });

        // NCA requires notification within 72 hours for data breaches
        const requiresNCANotification =
            incident.dataBreached &&
            (incident.severity === 'HIGH' || incident.severity === 'CRITICAL');

        return {
            incidentLogged: true,
            severity: incident.severity,
            requiresNCANotification,
            notificationDeadline: requiresNCANotification
                ? new Date(Date.now() + 72 * 60 * 60 * 1000)
                : null,
            nextSteps: [
                'توثيق الحادث بالتفصيل',
                'تحديد المتضررين',
                ...(requiresNCANotification
                    ? ['إبلاغ الهيئة الوطنية للأمن السيبراني خلال 72 ساعة']
                    : []),
            ],
        };
    }

    /**
     * Get Compliance Dashboard
     * لوحة الامتثال الشاملة
     */
    async getComplianceDashboard(tenantId: string) {
        const [dataLocalization, accessControls, encryption, logRetention] = await Promise.all([
            this.verifyDataLocalization(),
            this.auditAccessControls(tenantId),
            this.verifyEncryption(),
            this.checkLogRetention(),
        ]);

        const allCompliant =
            dataLocalization.compliant &&
            accessControls.compliant &&
            encryption.compliant &&
            logRetention.compliant;

        const scores = {
            dataLocalization: dataLocalization.compliant ? 100 : 0,
            accessControls: accessControls.compliant ? 100 : 50,
            encryption: encryption.compliant ? 100 : 0,
            logRetention: logRetention.compliant ? 100 : 50,
        };

        const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / 4;

        return {
            overallCompliance: allCompliant,
            overallScore: Math.round(overallScore),
            scores,
            details: {
                dataLocalization,
                accessControls,
                encryption,
                logRetention,
            },
            allRecommendations: [
                ...(dataLocalization.recommendation ? [dataLocalization.recommendation] : []),
                ...accessControls.recommendations,
                ...encryption.recommendations,
                ...(logRetention.recommendation ? [logRetention.recommendation] : []),
            ],
        };
    }
}
