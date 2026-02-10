import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { LegalDocumentsService } from './legal-documents.service';
import { LegalDocumentsController } from './legal-documents.controller';

@Module({
    imports: [PrismaModule],
    controllers: [LegalDocumentsController],
    providers: [LegalDocumentsService],
    exports: [LegalDocumentsService],
})
export class LegalDocumentsModule { }
