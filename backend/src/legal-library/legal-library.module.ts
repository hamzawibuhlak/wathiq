import { Module } from '@nestjs/common';
import { LegalLibraryService } from './legal-library.service';
import { LegalLibraryController } from './legal-library.controller';
import { LegalAIService } from './legal-ai.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [LegalLibraryController],
    providers: [LegalLibraryService, LegalAIService],
    exports: [LegalLibraryService, LegalAIService],
})
export class LegalLibraryModule { }
