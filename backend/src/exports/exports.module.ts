import { Module } from '@nestjs/common';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExportsController, ImportController],
  providers: [ExportsService, ImportService],
  exports: [ExportsService, ImportService],
})
export class ExportsModule { }

