import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PredictiveAnalyticsService } from './predictive.service';
import { ReportBuilderService } from './report-builder.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PredictiveAnalyticsService, ReportBuilderService],
  exports: [AnalyticsService, PredictiveAnalyticsService, ReportBuilderService],
})
export class AnalyticsModule { }
