import { Module } from '@nestjs/common';
import { DocumentFoldersController } from './document-folders.controller';
import { DocumentFoldersService } from './document-folders.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DocumentFoldersController],
    providers: [DocumentFoldersService],
    exports: [DocumentFoldersService],
})
export class DocumentFoldersModule {}
