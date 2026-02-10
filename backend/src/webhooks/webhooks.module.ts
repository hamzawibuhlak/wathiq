import { Module } from '@nestjs/common';
import { TwilioWebhooksController } from './twilio.controller';
import { CallsModule } from '../calls/calls.module';

@Module({
    imports: [CallsModule],
    controllers: [TwilioWebhooksController],
})
export class WebhooksModule { }
