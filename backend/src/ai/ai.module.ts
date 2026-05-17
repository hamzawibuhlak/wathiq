import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiConfigService } from './ai-config.service';
import { AiConfigController } from './ai-config.controller';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [AiController, AiConfigController],
    providers: [AiService, AiConfigService],
    exports: [AiService, AiConfigService],
})
export class AiModule { }
