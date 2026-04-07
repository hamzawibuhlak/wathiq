import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { DocumentFoldersModule } from '../document-folders/document-folders.module';

@Module({
    imports: [DocumentFoldersModule],
    controllers: [ClientsController],
    providers: [ClientsService],
    exports: [ClientsService],
})
export class ClientsModule { }
