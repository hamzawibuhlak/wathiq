import { Module } from '@nestjs/common';
import { GroupChatService } from './group-chat.service';
import { GroupChatController } from './group-chat.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GroupChatController],
    providers: [GroupChatService],
    exports: [GroupChatService],
})
export class MessagingModule { }
