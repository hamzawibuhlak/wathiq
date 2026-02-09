import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { QueryOptimizerService } from '../common/services/query-optimizer.service';
import { CacheService } from '../cache/cache.service';

@Module({
    controllers: [PerformanceController],
    providers: [QueryOptimizerService],
    exports: [QueryOptimizerService],
})
export class PerformanceModule { }
