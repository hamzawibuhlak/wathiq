import { Module } from '@nestjs/common';
import { HearingsController } from './hearings.controller';
import { HearingsService } from './hearings.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    controllers: [HearingsController],
    providers: [HearingsService],
    exports: [HearingsService],
})
export class HearingsModule { }
