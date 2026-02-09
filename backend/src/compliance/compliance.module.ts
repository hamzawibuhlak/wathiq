import { Module } from '@nestjs/common';
import { GdprService } from './gdpr.service';
import { SaudiComplianceService } from './saudi-compliance.service';
import { ComplianceController } from './compliance.controller';

@Module({
    controllers: [ComplianceController],
    providers: [GdprService, SaudiComplianceService],
    exports: [GdprService, SaudiComplianceService],
})
export class ComplianceModule { }
