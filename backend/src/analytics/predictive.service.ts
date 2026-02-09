import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CaseType } from '@prisma/client';

interface CaseDuration {
    days: number;
    priority: string;
}

@Injectable()
export class PredictiveAnalyticsService {
    private readonly logger = new Logger(PredictiveAnalyticsService.name);

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) { }

    /**
     * Predict case duration based on historical data
     */
    async predictCaseDuration(tenantId: string, caseData: {
        caseType: CaseType;
        priority: string;
    }): Promise<{ predictedDays: number; confidence: number }> {
        const historicalCases = await this.prisma.case.findMany({
            where: {
                tenantId,
                status: 'CLOSED',
                caseType: caseData.caseType,
            },
            select: {
                priority: true,
                createdAt: true,
                updatedAt: true,
            },
            take: 100,
        });

        if (historicalCases.length < 10) {
            return { predictedDays: 90, confidence: 0.3 };
        }

        const durations: CaseDuration[] = historicalCases.map((c) => {
            const days = Math.floor(
                (c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
                days,
                priority: c.priority,
            };
        });

        const similarCases = durations.filter(
            (d) => d.priority === caseData.priority
        );

        if (similarCases.length > 0) {
            const avgDuration = similarCases.reduce((sum: number, c: CaseDuration) => sum + c.days, 0) / similarCases.length;
            const confidence = Math.min(similarCases.length / 20, 0.9);
            return {
                predictedDays: Math.round(avgDuration),
                confidence,
            };
        }

        const avgDuration = durations.reduce((sum: number, c: CaseDuration) => sum + c.days, 0) / durations.length;
        return {
            predictedDays: Math.round(avgDuration),
            confidence: 0.6,
        };
    }

    /**
     * Predict revenue for next period
     */
    async predictRevenue(tenantId: string, period: 'month' | 'quarter' | 'year'): Promise<{
        predicted: number;
        confidence: number;
        trend: 'up' | 'down' | 'stable';
    }> {
        const months = 12;
        const revenues: number[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const result = await this.prisma.invoice.aggregate({
                where: {
                    tenantId,
                    status: 'PAID',
                    paidAt: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
                _sum: { totalAmount: true },
            });

            revenues.push(Number(result._sum.totalAmount) || 0);
        }

        const { slope, intercept } = this.linearRegression(revenues);

        const periodsAhead = period === 'month' ? 1 : period === 'quarter' ? 3 : 12;
        const predicted = Math.max(0, slope * (months + periodsAhead) + intercept);

        const recentAvg = revenues.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
        const olderAvg = revenues.slice(0, 3).reduce((a: number, b: number) => a + b, 0) / 3;
        const trend = recentAvg > olderAvg * 1.1 ? 'up' : recentAvg < olderAvg * 0.9 ? 'down' : 'stable';

        const confidence = Math.min(Math.max(this.calculateRSquared(revenues, slope, intercept), 0.3), 0.9);

        return {
            predicted: Math.round(predicted),
            confidence,
            trend,
        };
    }

    /**
     * Predict client churn risk
     */
    async predictChurnRisk(tenantId: string, clientId: string): Promise<{
        riskLevel: 'low' | 'medium' | 'high';
        probability: number;
        factors: string[];
    }> {
        const client = await this.prisma.client.findUnique({
            where: { id: clientId },
            include: {
                cases: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                invoices: {
                    orderBy: { issueDate: 'desc' },
                    take: 10,
                },
            },
        });

        if (!client) {
            return { riskLevel: 'low', probability: 0, factors: [] };
        }

        const factors: string[] = [];
        let riskScore = 0;

        // Factor 1: Last case date
        if (client.cases.length > 0) {
            const lastCaseDate = client.cases[0].createdAt;
            const daysSinceLastCase = Math.floor(
                (Date.now() - lastCaseDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysSinceLastCase > 180) {
                riskScore += 40;
                factors.push('لم يتم فتح قضية جديدة منذ أكثر من 6 أشهر');
            } else if (daysSinceLastCase > 90) {
                riskScore += 20;
                factors.push('لم يتم فتح قضية جديدة منذ أكثر من 3 أشهر');
            }
        } else {
            riskScore += 60;
            factors.push('لا يوجد قضايا نشطة');
        }

        // Factor 2: Payment issues
        const unpaidInvoices = client.invoices.filter((i) => i.status === 'PENDING');
        if (unpaidInvoices.length > 2) {
            riskScore += 30;
            factors.push('عدة فواتير غير مدفوعة');
        }

        // Factor 3: Declining case frequency
        if (client.cases.length >= 5) {
            const recentCases = client.cases.slice(0, 3);
            const olderCases = client.cases.slice(3, 6);

            if (olderCases.length >= 2) {
                const recentAvgDays = this.calculateAverageDaysBetween(recentCases);
                const olderAvgDays = this.calculateAverageDaysBetween(olderCases);

                if (recentAvgDays > olderAvgDays * 1.5) {
                    riskScore += 20;
                    factors.push('تباطؤ في وتيرة القضايا الجديدة');
                }
            }
        }

        const probability = Math.min(riskScore / 100, 0.95);
        let riskLevel: 'low' | 'medium' | 'high';

        if (probability < 0.3) riskLevel = 'low';
        else if (probability < 0.6) riskLevel = 'medium';
        else riskLevel = 'high';

        return { riskLevel, probability, factors };
    }

    /**
     * Generate AI-powered insights (without OpenAI)
     */
    async generateInsights(tenantId: string): Promise<string[]> {
        const insights: string[] = [];

        // Get basic stats
        const [openCases, closedCases, pendingInvoices, paidInvoices] = await Promise.all([
            this.prisma.case.count({ where: { tenantId, status: 'OPEN' } }),
            this.prisma.case.count({ where: { tenantId, status: 'CLOSED' } }),
            this.prisma.invoice.count({ where: { tenantId, status: 'PENDING' } }),
            this.prisma.invoice.count({ where: { tenantId, status: 'PAID' } }),
        ]);

        const totalCases = openCases + closedCases;
        const totalInvoices = pendingInvoices + paidInvoices;

        // Insight 1: Closure rate
        if (totalCases > 0) {
            const closureRate = Math.round((closedCases / totalCases) * 100);
            if (closureRate > 70) {
                insights.push(`معدل إغلاق القضايا ممتاز (${closureRate}%) - استمر في هذا الأداء`);
            } else if (closureRate < 40) {
                insights.push(`معدل إغلاق القضايا منخفض (${closureRate}%) - راجع القضايا المفتوحة`);
            }
        }

        // Insight 2: Payment success rate
        if (totalInvoices > 0) {
            const paymentRate = Math.round((paidInvoices / totalInvoices) * 100);
            if (paymentRate > 80) {
                insights.push(`معدل التحصيل ممتاز (${paymentRate}%)`);
            } else if (paymentRate < 50) {
                insights.push(`معدل التحصيل يحتاج تحسين (${paymentRate}%) - تابع الفواتير المعلقة`);
            }
        }

        // Insight 3: Pending invoices
        if (pendingInvoices > 5) {
            insights.push(`يوجد ${pendingInvoices} فاتورة معلقة - يُنصح بالمتابعة مع العملاء`);
        }

        // Insight 4: Open cases workload
        if (openCases > 20) {
            insights.push(`عدد القضايا المفتوحة مرتفع (${openCases}) - قد تحتاج لتوزيع العمل`);
        }

        // Default insight
        if (insights.length === 0) {
            insights.push('أداء المكتب جيد - استمر في المتابعة');
        }

        return insights.slice(0, 5);
    }

    // Helper methods
    private linearRegression(values: number[]): { slope: number; intercept: number } {
        const n = values.length;
        if (n === 0) return { slope: 0, intercept: 0 };

        const sumX = values.reduce((sum: number, _: number, i: number) => sum + i, 0);
        const sumY = values.reduce((sum: number, y: number) => sum + y, 0);
        const sumXY = values.reduce((sum: number, y: number, i: number) => sum + i * y, 0);
        const sumX2 = values.reduce((sum: number, _: number, i: number) => sum + i * i, 0);

        const denominator = n * sumX2 - sumX * sumX;
        if (denominator === 0) return { slope: 0, intercept: sumY / n };

        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
    }

    private calculateRSquared(values: number[], slope: number, intercept: number): number {
        const n = values.length;
        if (n === 0) return 0;

        const mean = values.reduce((sum: number, y: number) => sum + y, 0) / n;
        const ssTotal = values.reduce((sum: number, y: number) => sum + Math.pow(y - mean, 2), 0);

        if (ssTotal === 0) return 1;

        const ssRes = values.reduce((sum: number, y: number, i: number) => {
            const predicted = slope * i + intercept;
            return sum + Math.pow(y - predicted, 2);
        }, 0);

        return Math.max(0, 1 - ssRes / ssTotal);
    }

    private calculateAverageDaysBetween(cases: { createdAt: Date }[]): number {
        if (cases.length < 2) return 0;

        const days: number[] = [];
        for (let i = 1; i < cases.length; i++) {
            const diff = Math.floor(
                (cases[i - 1].createdAt.getTime() - cases[i].createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            days.push(Math.abs(diff));
        }

        return days.length > 0 ? days.reduce((sum: number, d: number) => sum + d, 0) / days.length : 0;
    }
}
