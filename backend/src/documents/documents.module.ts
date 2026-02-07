import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { TemplatesService } from './templates.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DocumentsController],
    providers: [DocumentsService, TemplatesService],
    exports: [DocumentsService, TemplatesService],
})
export class DocumentsModule { }
