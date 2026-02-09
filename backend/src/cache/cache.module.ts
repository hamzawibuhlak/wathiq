import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

/**
 * Cache Module - Redis/Memory caching
 */
@Global()
@Module({
    imports: [
        CacheModule.register({
            ttl: 300000, // 5 minutes default (in ms)
            max: 1000, // Maximum number of items in cache
            isGlobal: true,
        }),
    ],
    providers: [CacheService],
    exports: [CacheModule, CacheService],
})
export class CacheConfigModule { }
