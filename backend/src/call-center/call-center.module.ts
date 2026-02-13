import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CallCenterController } from './call-center.controller';
import { CallCenterSettingsController } from './call-center-settings.controller';
import { SipExtensionService } from './sip-extension.service';
import { CallRecordService } from './call-record.service';
import { GdmsApiService } from './gdms-api.service';
import { CallCenterSettingsService } from './call-center-settings.service';

@Module({
    imports: [PrismaModule],
    controllers: [CallCenterController, CallCenterSettingsController],
    providers: [
        SipExtensionService,
        CallRecordService,
        GdmsApiService,
        CallCenterSettingsService,
    ],
    exports: [
        SipExtensionService,
        CallRecordService,
        GdmsApiService,
        CallCenterSettingsService,
    ],
})
export class CallCenterModule { }

