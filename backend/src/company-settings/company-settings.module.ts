import { Module } from '@nestjs/common';
import { CompanySettingsService } from './company-settings.service';
import { CompanySettingsController } from './company-settings.controller';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    controllers: [CompanySettingsController],
    providers: [CompanySettingsService],
    exports: [CompanySettingsService],
})
export class CompanySettingsModule { }
