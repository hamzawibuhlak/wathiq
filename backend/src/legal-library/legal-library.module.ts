import { Module } from '@nestjs/common';
import { LegalLibraryService } from './legal-library.service';
import { LegalLibraryController } from './legal-library.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [LegalLibraryController],
    providers: [LegalLibraryService],
    exports: [LegalLibraryService],
})
export class LegalLibraryModule { }
