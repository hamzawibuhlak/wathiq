import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EncryptionService } from '../common/services/encryption.service';
import { HrController } from './hr.controller';
import { EmployeeService } from './employee.service';
import { AttendanceService } from './attendance.service';
import { LeaveService } from './leave.service';
import { PayrollService } from './payroll.service';

@Module({
    imports: [PrismaModule],
    controllers: [HrController],
    providers: [EmployeeService, AttendanceService, LeaveService, PayrollService, EncryptionService],
    exports: [EmployeeService, AttendanceService, LeaveService, PayrollService],
})
export class HrModule { }
