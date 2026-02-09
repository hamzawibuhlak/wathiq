import { Module } from '@nestjs/common';
import { SecurityMonitoringService } from './security-monitoring.service';

@Module({
    providers: [SecurityMonitoringService],
    exports: [SecurityMonitoringService],
})
export class SecurityModule { }
