import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ExportsModule } from '../exports/exports.module';

@Module({
    imports: [PrismaModule, ExportsModule],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule { }
