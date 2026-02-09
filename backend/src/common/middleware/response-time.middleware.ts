import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Response Time Middleware - API performance monitoring
 * يسجل وقت استجابة كل طلب
 */
@Injectable()
export class ResponseTimeMiddleware implements NestMiddleware {
    private readonly logger = new Logger('ResponseTime');
    private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second

    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        const { method, originalUrl } = req;

        res.on('finish', () => {
            const duration = Date.now() - start;
            const { statusCode } = res;

            // Log slow requests
            if (duration > this.SLOW_REQUEST_THRESHOLD) {
                this.logger.warn(
                    `🐢 Slow: ${method} ${originalUrl} - ${statusCode} - ${duration}ms`
                );
            }

            // Log all requests in debug mode
            if (process.env.LOG_RESPONSE_TIME === 'true') {
                this.logger.log(
                    `${method} ${originalUrl} - ${statusCode} - ${duration}ms`
                );
            }
        });

        next();
    }
}

/**
 * Performance Metrics Collector
 * جمع إحصائيات الأداء
 */
@Injectable()
export class PerformanceMetricsMiddleware implements NestMiddleware {
    private static metrics = {
        totalRequests: 0,
        slowRequests: 0,
        totalDuration: 0,
        byEndpoint: new Map<string, { count: number; totalTime: number }>(),
    };

    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        const endpoint = `${req.method} ${req.route?.path || req.path}`;

        res.on('finish', () => {
            const duration = Date.now() - start;

            PerformanceMetricsMiddleware.metrics.totalRequests++;
            PerformanceMetricsMiddleware.metrics.totalDuration += duration;

            if (duration > 1000) {
                PerformanceMetricsMiddleware.metrics.slowRequests++;
            }

            // Track by endpoint
            const endpointMetrics = PerformanceMetricsMiddleware.metrics.byEndpoint.get(endpoint) || {
                count: 0,
                totalTime: 0,
            };
            endpointMetrics.count++;
            endpointMetrics.totalTime += duration;
            PerformanceMetricsMiddleware.metrics.byEndpoint.set(endpoint, endpointMetrics);
        });

        next();
    }

    static getMetrics() {
        const { totalRequests, slowRequests, totalDuration, byEndpoint } = this.metrics;

        const endpointStats = Array.from(byEndpoint.entries())
            .map(([endpoint, stats]) => ({
                endpoint,
                count: stats.count,
                avgTime: Math.round(stats.totalTime / stats.count),
            }))
            .sort((a, b) => b.avgTime - a.avgTime)
            .slice(0, 10);

        return {
            totalRequests,
            slowRequests,
            avgResponseTime: totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0,
            slowRequestPercentage: totalRequests > 0
                ? ((slowRequests / totalRequests) * 100).toFixed(2)
                : 0,
            slowestEndpoints: endpointStats,
        };
    }

    static resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            slowRequests: 0,
            totalDuration: 0,
            byEndpoint: new Map(),
        };
    }
}
