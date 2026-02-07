import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionsService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Create a new session
     */
    async create(
        userId: string,
        ipAddress?: string,
        userAgent?: string,
        deviceInfo?: string,
    ) {
        // Generate unique session token
        const token = randomBytes(64).toString('hex');

        // Set expiration to 30 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Parse location from IP (simplified - in production use IP geolocation service)
        const location = ipAddress ? 'Unknown' : undefined;

        const session = await this.prisma.userSession.create({
            data: {
                userId,
                token,
                ipAddress,
                userAgent,
                deviceInfo,
                location,
                expiresAt,
                isActive: true,
            },
        });

        return session;
    }

    /**
     * Get all active sessions for a user
     */
    async findUserSessions(userId: string) {
        const sessions = await this.prisma.userSession.findMany({
            where: {
                userId,
                isActive: true,
            },
            orderBy: { lastActivity: 'desc' },
            select: {
                id: true,
                token: true,
                ipAddress: true,
                userAgent: true,
                deviceInfo: true,
                location: true,
                lastActivity: true,
                createdAt: true,
                expiresAt: true,
            },
        });

        return { data: sessions };
    }

    /**
     * Find session by token
     */
    async findByToken(token: string) {
        const session = await this.prisma.userSession.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        isActive: true,
                        tenantId: true,
                    },
                },
            },
        });

        return session;
    }

    /**
     * Update last activity for session
     */
    async updateActivity(token: string) {
        try {
            await this.prisma.userSession.update({
                where: { token },
                data: { lastActivity: new Date() },
            });
        } catch {
            // Ignore if session doesn't exist
        }
    }

    /**
     * Invalidate a specific session
     */
    async invalidate(sessionId: string, userId: string) {
        const session = await this.prisma.userSession.findFirst({
            where: { id: sessionId, userId },
        });

        if (!session) {
            throw new NotFoundException('الجلسة غير موجودة');
        }

        await this.prisma.userSession.update({
            where: { id: sessionId },
            data: { isActive: false },
        });

        return { message: 'تم إنهاء الجلسة بنجاح' };
    }

    /**
     * Invalidate all sessions for a user (except current)
     */
    async invalidateAll(userId: string, currentToken?: string) {
        const where: any = { userId, isActive: true };
        
        if (currentToken) {
            where.NOT = { token: currentToken };
        }

        const result = await this.prisma.userSession.updateMany({
            where,
            data: { isActive: false },
        });

        return {
            message: `تم إنهاء ${result.count} جلسة بنجاح`,
            count: result.count,
        };
    }

    /**
     * Invalidate all sessions for a user (including current - for logout everywhere)
     */
    async logoutEverywhere(userId: string) {
        const result = await this.prisma.userSession.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false },
        });

        return {
            message: 'تم تسجيل الخروج من جميع الأجهزة',
            count: result.count,
        };
    }

    /**
     * Clean up expired sessions (run as cron job)
     */
    async cleanupExpired() {
        const result = await this.prisma.userSession.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isActive: false, lastActivity: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
                ],
            },
        });

        return {
            message: `تم حذف ${result.count} جلسة منتهية الصلاحية`,
            count: result.count,
        };
    }

    /**
     * Get session stats for a user
     */
    async getStats(userId: string) {
        const [active, total] = await Promise.all([
            this.prisma.userSession.count({
                where: { userId, isActive: true },
            }),
            this.prisma.userSession.count({
                where: { userId },
            }),
        ]);

        // Get last activity
        const lastSession = await this.prisma.userSession.findFirst({
            where: { userId, isActive: true },
            orderBy: { lastActivity: 'desc' },
            select: { lastActivity: true },
        });

        return {
            data: {
                activeSessions: active,
                totalSessions: total,
                lastActivity: lastSession?.lastActivity,
            },
        };
    }
}
