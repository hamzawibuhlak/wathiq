import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Cache Service - خدمة التخزين المؤقت
 * Redis-based caching with tenant isolation
 */
@Injectable()
export class CacheService implements OnModuleInit {
    private readonly logger = new Logger(CacheService.name);
    private isRedisConnected = false;

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    async onModuleInit() {
        try {
            await this.cacheManager.set('health-check', 'ok', 10);
            const result = await this.cacheManager.get('health-check');
            this.isRedisConnected = result === 'ok';
            this.logger.log(`Cache connection: ${this.isRedisConnected ? '✅ Connected' : '❌ Failed'}`);
        } catch (error) {
            this.logger.warn('Redis not available, using in-memory cache');
            this.isRedisConnected = false;
        }
    }

    /**
     * Get from cache or execute function and cache result
     */
    async getOrSet<T>(
        key: string,
        fn: () => Promise<T>,
        ttl = 300 // 5 minutes default
    ): Promise<T> {
        try {
            const cached = await this.cacheManager.get<T>(key);

            if (cached !== undefined && cached !== null) {
                this.logger.debug(`Cache HIT: ${key}`);
                return cached;
            }

            this.logger.debug(`Cache MISS: ${key}`);
            const result = await fn();

            if (result !== undefined && result !== null) {
                await this.cacheManager.set(key, result, ttl * 1000);
            }

            return result;
        } catch (error) {
            this.logger.error(`Cache error for ${key}:`, error);
            // Fallback to function execution
            return fn();
        }
    }

    /**
     * Build namespaced cache key
     */
    buildKey(namespace: string, ...parts: string[]): string {
        return `${namespace}:${parts.filter(Boolean).join(':')}`;
    }

    /**
     * Build tenant-specific key
     */
    tenantKey(tenantId: string, namespace: string, ...parts: string[]): string {
        return this.buildKey('tenant', tenantId, namespace, ...parts);
    }

    /**
     * Get value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const result = await this.cacheManager.get<T>(key);
            return result ?? null;
        } catch (error) {
            this.logger.error(`Cache get error for ${key}:`, error);
            return null;
        }
    }

    /**
     * Set value in cache
     */
    async set(key: string, value: any, ttl = 300): Promise<void> {
        try {
            await this.cacheManager.set(key, value, ttl * 1000);
        } catch (error) {
            this.logger.error(`Cache set error for ${key}:`, error);
        }
    }

    /**
     * Delete from cache
     */
    async del(key: string): Promise<void> {
        try {
            await this.cacheManager.del(key);
        } catch (error) {
            this.logger.error(`Cache delete error for ${key}:`, error);
        }
    }

    /**
     * Invalidate all keys matching pattern
     * Note: Requires Redis, won't work with in-memory cache
     */
    async invalidatePattern(pattern: string): Promise<number> {
        try {
            const store = (this.cacheManager as any).store || (this.cacheManager as any).stores?.[0];

            if (store.keys) {
                const keys = await store.keys(pattern);
                if (keys.length > 0) {
                    await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
                    this.logger.debug(`Invalidated ${keys.length} keys matching: ${pattern}`);
                }
                return keys.length;
            }

            return 0;
        } catch (error) {
            this.logger.error(`Pattern invalidation error for ${pattern}:`, error);
            return 0;
        }
    }

    /**
     * Invalidate all cache for a tenant
     */
    async invalidateTenant(tenantId: string): Promise<void> {
        await this.invalidatePattern(`tenant:${tenantId}:*`);
    }

    /**
     * Invalidate entity cache
     */
    async invalidateEntity(tenantId: string, entity: string, id?: string): Promise<void> {
        if (id) {
            await this.del(this.tenantKey(tenantId, entity, id));
        }
        await this.invalidatePattern(this.tenantKey(tenantId, entity, '*'));
        // Also invalidate list caches
        await this.invalidatePattern(this.tenantKey(tenantId, `${entity}-list`, '*'));
    }

    /**
     * Cache decorator helper
     */
    async cached<T>(
        tenantId: string,
        entity: string,
        id: string,
        fn: () => Promise<T>,
        ttl = 300
    ): Promise<T> {
        const key = this.tenantKey(tenantId, entity, id);
        return this.getOrSet(key, fn, ttl);
    }

    /**
     * Cache list with pagination info
     */
    async cacheList<T>(
        tenantId: string,
        entity: string,
        queryHash: string,
        fn: () => Promise<T>,
        ttl = 60 // Shorter TTL for lists
    ): Promise<T> {
        const key = this.tenantKey(tenantId, `${entity}-list`, queryHash);
        return this.getOrSet(key, fn, ttl);
    }

    /**
     * Get cache stats
     */
    async getStats(): Promise<{
        isConnected: boolean;
        type: string;
    }> {
        return {
            isConnected: this.isRedisConnected,
            type: this.isRedisConnected ? 'redis' : 'memory',
        };
    }
}
