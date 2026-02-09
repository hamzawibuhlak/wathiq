import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Query Optimization Service
 * خدمة تحسين الاستعلامات
 */
@Injectable()
export class QueryOptimizerService {
    private readonly logger = new Logger(QueryOptimizerService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Cursor-based pagination - أفضل للـ datasets الكبيرة
     */
    async paginateWithCursor<T>(
        model: any,
        where: any,
        orderBy: any,
        cursor?: string,
        limit = 50
    ): Promise<{ data: T[]; nextCursor: string | null; hasMore: boolean }> {
        const items = await model.findMany({
            where,
            orderBy,
            take: limit + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        });

        const hasMore = items.length > limit;
        const data = hasMore ? items.slice(0, -1) : items;
        const nextCursor = hasMore ? data[data.length - 1].id : null;

        return { data, nextCursor, hasMore };
    }

    /**
     * Batch load by IDs - يمنع N+1 queries
     */
    async batchLoadByIds<T>(
        model: any,
        ids: string[],
        select?: any
    ): Promise<Map<string, T>> {
        if (ids.length === 0) return new Map();

        const items = await model.findMany({
            where: { id: { in: [...new Set(ids)] } },
            ...(select && { select }),
        });

        return new Map(items.map((item: any) => [item.id, item]));
    }

    /**
     * Get table statistics
     */
    async getTableStats(tableName: string): Promise<any> {
        try {
            const stats = await this.prisma.$queryRaw`
                SELECT 
                    relname as table_name,
                    n_live_tup as row_count,
                    n_dead_tup as dead_rows,
                    last_vacuum,
                    last_autovacuum,
                    pg_size_pretty(pg_total_relation_size(relid)) as total_size
                FROM pg_stat_user_tables
                WHERE relname = ${tableName};
            `;
            return stats;
        } catch (error) {
            this.logger.error(`Failed to get stats for ${tableName}:`, error);
            return null;
        }
    }

    /**
     * Get all table sizes
     */
    async getAllTableSizes(): Promise<any[]> {
        try {
            const sizes = await this.prisma.$queryRaw`
                SELECT 
                    relname as table_name,
                    n_live_tup as row_count,
                    pg_size_pretty(pg_total_relation_size(relid)) as total_size
                FROM pg_stat_user_tables
                ORDER BY pg_total_relation_size(relid) DESC
                LIMIT 20;
            `;
            return sizes as any[];
        } catch (error) {
            this.logger.error('Failed to get table sizes:', error);
            return [];
        }
    }

    /**
     * Get slow queries (if pg_stat_statements is enabled)
     */
    async getSlowQueries(): Promise<any[]> {
        try {
            const queries = await this.prisma.$queryRaw`
                SELECT 
                    query,
                    calls,
                    mean_exec_time as avg_time_ms,
                    total_exec_time as total_time_ms
                FROM pg_stat_statements
                WHERE mean_exec_time > 100
                ORDER BY mean_exec_time DESC
                LIMIT 10;
            `;
            return queries as any[];
        } catch (error) {
            // pg_stat_statements might not be enabled
            this.logger.warn('pg_stat_statements not available');
            return [];
        }
    }

    /**
     * Get index usage statistics
     */
    async getIndexUsage(): Promise<any[]> {
        try {
            const indexStats = await this.prisma.$queryRaw`
                SELECT 
                    schemaname,
                    relname as table_name,
                    indexrelname as index_name,
                    idx_scan as times_used,
                    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
                FROM pg_stat_user_indexes
                ORDER BY idx_scan DESC
                LIMIT 30;
            `;
            return indexStats as any[];
        } catch (error) {
            this.logger.error('Failed to get index usage:', error);
            return [];
        }
    }

    /**
     * Find unused indexes
     */
    async getUnusedIndexes(): Promise<any[]> {
        try {
            const unused = await this.prisma.$queryRaw`
                SELECT 
                    schemaname,
                    relname as table_name,
                    indexrelname as index_name,
                    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
                FROM pg_stat_user_indexes
                WHERE idx_scan = 0
                AND indexrelname NOT LIKE '%pkey%'
                ORDER BY pg_relation_size(indexrelid) DESC
                LIMIT 10;
            `;
            return unused as any[];
        } catch (error) {
            this.logger.error('Failed to get unused indexes:', error);
            return [];
        }
    }

    /**
     * Database health check
     */
    async getDatabaseHealth(): Promise<{
        connectionCount: number;
        databaseSize: string;
        cacheHitRatio: number;
        activeQueries: number;
    }> {
        try {
            const [connections, size, cacheHit, active] = await Promise.all([
                this.prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity;`,
                this.prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size;`,
                this.prisma.$queryRaw`
                    SELECT 
                        round(100.0 * sum(blks_hit) / nullif(sum(blks_hit) + sum(blks_read), 0), 2) as ratio
                    FROM pg_stat_database;
                `,
                this.prisma.$queryRaw`
                    SELECT count(*) as count 
                    FROM pg_stat_activity 
                    WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%';
                `,
            ]);

            return {
                connectionCount: Number((connections as any)[0]?.count || 0),
                databaseSize: (size as any)[0]?.size || '0 MB',
                cacheHitRatio: Number((cacheHit as any)[0]?.ratio || 0),
                activeQueries: Number((active as any)[0]?.count || 0),
            };
        } catch (error) {
            this.logger.error('Failed to get database health:', error);
            return {
                connectionCount: 0,
                databaseSize: 'Unknown',
                cacheHitRatio: 0,
                activeQueries: 0,
            };
        }
    }
}
