import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsAppService } from './whatsapp.service';
import { WhatsappBaileysService } from './whatsapp-baileys.service';
import { WhatsAppController } from './whatsapp.controller';
import { WasmaltheeqaController } from './wasmaltheeqa.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [HttpModule, PrismaModule, NotificationsModule, WebSocketModule],
  controllers: [WhatsAppController, WasmaltheeqaController],
  providers: [WhatsAppService, WhatsappBaileysService],
  exports: [WhatsAppService, WhatsappBaileysService],
})
export class WhatsAppModule { }
