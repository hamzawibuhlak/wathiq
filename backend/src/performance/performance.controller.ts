import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { QueryOptimizerService } from '../common/services/query-optimizer.service';
import { CacheService } from '../cache/cache.service';
import { PerformanceMetricsMiddleware } from '../common/middleware/response-time.middleware';

@Controller('performance')
@ApiTags('Performance Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceController {
    constructor(
        private queryOptimizer: QueryOptimizerService,
        private cacheService: CacheService,
    ) { }

    /**
     * Get system performance dashboard
     */
    @Get('dashboard')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'لوحة مراقبة الأداء' })
    async getDashboard() {
        const [dbHealth, cacheStats, apiMetrics] = await Promise.all([
            this.queryOptimizer.getDatabaseHealth(),
            this.cacheService.getStats(),
            Promise.resolve(PerformanceMetricsMiddleware.getMetrics()),
        ]);

        return {
            timestamp: new Date().toISOString(),
            database: dbHealth,
            cache: cacheStats,
            api: apiMetrics,
        };
    }

    /**
     * Get database statistics
     */
    @Get('database')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'إحصائيات قاعدة البيانات' })
    async getDatabaseStats() {
        const [health, tableSizes, indexUsage, unusedIndexes] = await Promise.all([
            this.queryOptimizer.getDatabaseHealth(),
            this.queryOptimizer.getAllTableSizes(),
            this.queryOptimizer.getIndexUsage(),
            this.queryOptimizer.getUnusedIndexes(),
        ]);

        return {
            health,
            tables: tableSizes,
            indexUsage: indexUsage.slice(0, 15),
            unusedIndexes,
        };
    }

    /**
     * Get cache statistics
     */
    @Get('cache')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'إحصائيات التخزين المؤقت' })
    async getCacheStats() {
        return this.cacheService.getStats();
    }

    /**
     * Get API performance metrics
     */
    @Get('api')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'مقاييس أداء API' })
    async getApiMetrics() {
        return PerformanceMetricsMiddleware.getMetrics();
    }

    /**
     * Get slow queries (if available)
     */
    @Get('slow-queries')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'الاستعلامات البطيئة' })
    async getSlowQueries() {
        return this.queryOptimizer.getSlowQueries();
    }
}
