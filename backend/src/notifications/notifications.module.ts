import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsController } from './notifications.controller';
import { MessagesController } from './messages.controller';
import { NotificationsService } from './notifications.service';
import { MessagesService } from './messages.service';
import { ScheduledNotificationsService } from './scheduled-notifications.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => WebSocketModule),
        ScheduleModule.forRoot(),
    ],
    controllers: [
        NotificationsController,
        MessagesController,
    ],
    providers: [
        NotificationsService,
        MessagesService,
        ScheduledNotificationsService,
    ],
    exports: [
        NotificationsService,
        MessagesService,
    ],
})
export class NotificationsModule { }
