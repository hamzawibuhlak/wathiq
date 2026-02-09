import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Security Event Types
 */
export type SecurityEventType =
    | 'FAILED_LOGIN'
    | 'SUSPICIOUS_ACTIVITY'
    | 'UNAUTHORIZED_ACCESS'
    | 'RATE_LIMIT_EXCEEDED'
    | 'INVALID_TOKEN'
    | 'SQL_INJECTION_ATTEMPT'
    | 'XSS_ATTEMPT'
    | 'BRUTE_FORCE_ATTEMPT'
    | 'ACCOUNT_LOCKED'
    | 'PASSWORD_CHANGED'
    | '2FA_ENABLED'
    | '2FA_DISABLED'
    | 'SESSION_CREATED'
    | 'SESSION_TERMINATED';

/**
 * Security Event Severity
 */
export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Security Monitoring Service
 * مراقبة الأمان واكتشاف التهديدات
 */
@Injectable()
export class SecurityMonitoringService {
    private readonly FAILED_LOGIN_THRESHOLD = 5;
    private readonly FAILED_LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes
    private readonly RATE_LIMIT_THRESHOLD = 100;
    private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

    // In-memory store for rate limiting (use Redis in production)
    private failedLogins = new Map<string, { count: number; lastAttempt: Date }>();
    private requestCounts = new Map<string, { count: number; windowStart: Date }>();

    constructor(private prisma: PrismaService) { }

    /**
     * Log a security event
     */
    async logSecurityEvent(event: {
        type: SecurityEventType;
        severity: SecuritySeverity;
        description: string;
        userId?: string;
        tenantId?: string;
        ipAddress?: string;
        userAgent?: string;
        metadata?: any;
        blocked?: boolean;
    }) {
        // Log to console for critical events
        if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
            console.warn(`🚨 SECURITY [${event.severity}]: ${event.type} - ${event.description}`);
        }

        // Store in activity log with SECURITY action
        if (event.userId && event.tenantId) {
            await this.prisma.activityLog.create({
                data: {
                    action: `SECURITY_${event.type}`,
                    entity: 'Security',
                    entityId: null,
                    description: event.description,
                    userId: event.userId,
                    tenantId: event.tenantId,
                    ipAddress: event.ipAddress,
                    userAgent: event.userAgent,
                },
            });
        }

        // Alert on critical events
        if (event.severity === 'CRITICAL') {
            await this.sendSecurityAlert(event);
        }
    }

    /**
     * Track failed login attempts
     */
    async trackFailedLogin(email: string, ipAddress: string): Promise<boolean> {
        const key = `${email}:${ipAddress}`;
        const now = new Date();

        const existing = this.failedLogins.get(key);

        if (existing) {
            const timeDiff = now.getTime() - existing.lastAttempt.getTime();

            if (timeDiff < this.FAILED_LOGIN_WINDOW) {
                existing.count++;
                existing.lastAttempt = now;

                if (existing.count >= this.FAILED_LOGIN_THRESHOLD) {
                    await this.logSecurityEvent({
                        type: 'BRUTE_FORCE_ATTEMPT',
                        severity: 'HIGH',
                        description: `محاولات دخول فاشلة متكررة: ${email} من ${ipAddress}`,
                        ipAddress,
                        metadata: { email, failedAttempts: existing.count },
                        blocked: true,
                    });
                    return true; // Account should be locked
                }
            } else {
                // Reset counter after window
                existing.count = 1;
                existing.lastAttempt = now;
            }
        } else {
            this.failedLogins.set(key, { count: 1, lastAttempt: now });
        }

        return false;
    }

    /**
     * Clear failed login attempts on successful login
     */
    clearFailedLogins(email: string, ipAddress: string) {
        const key = `${email}:${ipAddress}`;
        this.failedLogins.delete(key);
    }

    /**
     * Check rate limit
     */
    async checkRateLimit(ipAddress: string): Promise<boolean> {
        const now = new Date();
        const existing = this.requestCounts.get(ipAddress);

        if (existing) {
            const timeDiff = now.getTime() - existing.windowStart.getTime();

            if (timeDiff < this.RATE_LIMIT_WINDOW) {
                existing.count++;

                if (existing.count > this.RATE_LIMIT_THRESHOLD) {
                    await this.logSecurityEvent({
                        type: 'RATE_LIMIT_EXCEEDED',
                        severity: 'MEDIUM',
                        description: `تجاوز حد الطلبات من ${ipAddress}`,
                        ipAddress,
                        metadata: { requestCount: existing.count },
                        blocked: true,
                    });
                    return true; // Rate limited
                }
            } else {
                existing.count = 1;
                existing.windowStart = now;
            }
        } else {
            this.requestCounts.set(ipAddress, { count: 1, windowStart: now });
        }

        return false;
    }

    /**
     * Detect SQL injection attempt
     */
    detectSQLInjection(input: string): boolean {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
            /(\b(UNION|JOIN)\b.*\b(SELECT)\b)/i,
            /(--|\#|\/\*)/,
            /(\bOR\b.*=.*)/i,
            /(\bAND\b.*=.*)/i,
            /(;.*\b(DROP|DELETE|UPDATE)\b)/i,
        ];

        return sqlPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Detect XSS attempt
     */
    detectXSS(input: string): boolean {
        const xssPatterns = [
            /<script/i,
            /javascript:/i,
            /onerror=/i,
            /onload=/i,
            /onclick=/i,
            /onmouseover=/i,
            /onfocus=/i,
            /onblur=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
            /eval\s*\(/i,
            /expression\s*\(/i,
        ];

        return xssPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Validate and sanitize input
     */
    async validateRequest(
        input: string,
        ipAddress: string,
    ): Promise<{ valid: boolean; threat?: string }> {
        if (this.detectSQLInjection(input)) {
            await this.logSecurityEvent({
                type: 'SQL_INJECTION_ATTEMPT',
                severity: 'CRITICAL',
                description: `محاولة SQL Injection من ${ipAddress}`,
                ipAddress,
                metadata: { input: input.substring(0, 100) },
                blocked: true,
            });
            return { valid: false, threat: 'SQL_INJECTION' };
        }

        if (this.detectXSS(input)) {
            await this.logSecurityEvent({
                type: 'XSS_ATTEMPT',
                severity: 'HIGH',
                description: `محاولة XSS من ${ipAddress}`,
                ipAddress,
                metadata: { input: input.substring(0, 100) },
                blocked: true,
            });
            return { valid: false, threat: 'XSS' };
        }

        return { valid: true };
    }

    /**
     * Get security dashboard data
     */
    async getSecurityDashboard(tenantId: string) {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [recentActivity, failedLogins] = await Promise.all([
            this.prisma.activityLog.count({
                where: {
                    tenantId,
                    action: { startsWith: 'SECURITY_' },
                    createdAt: { gte: last24Hours },
                },
            }),
            this.prisma.activityLog.count({
                where: {
                    tenantId,
                    action: 'SECURITY_FAILED_LOGIN',
                    createdAt: { gte: last7Days },
                },
            }),
        ]);

        return {
            securityEvents24h: recentActivity,
            failedLogins7d: failedLogins,
            riskLevel: this.calculateRiskLevel(recentActivity, failedLogins),
        };
    }

    /**
     * Calculate security risk level
     */
    private calculateRiskLevel(events24h: number, failedLogins7d: number): 'LOW' | 'MEDIUM' | 'HIGH' {
        if (events24h > 50 || failedLogins7d > 100) return 'HIGH';
        if (events24h > 10 || failedLogins7d > 20) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Send security alert (email/SMS to admins)
     */
    private async sendSecurityAlert(event: any) {
        // TODO: Implement email/SMS notification to admins
        console.error('🚨🚨🚨 CRITICAL SECURITY ALERT 🚨🚨🚨');
        console.error(JSON.stringify(event, null, 2));
    }
}
