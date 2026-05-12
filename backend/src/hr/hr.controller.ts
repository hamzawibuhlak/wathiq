import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, Res, Header } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmployeeService } from './employee.service';
import { AttendanceService } from './attendance.service';
import { LeaveService } from './leave.service';
import { PayrollService } from './payroll.service';
import { Response } from 'express';

@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
    constructor(
        private employeeService: EmployeeService,
        private attendanceService: AttendanceService,
        private leaveService: LeaveService,
        private payrollService: PayrollService,
    ) { }

    // ============ EMPLOYEES ============

    @Get('employees')
    getEmployees(@Req() req: any, @Query() query: any) {
        return this.employeeService.findAll(query);
    }

    @Get('employees/statistics')
    getStatistics(@Req() req: any) {
        return this.employeeService.getStatistics();
    }

    @Get('employees/org-chart')
    getOrgChart(@Req() req: any) {
        return this.employeeService.getOrganizationChart();
    }

    @Get('employees/:id')
    getEmployee(@Param('id') id: string, @Req() req: any) {
        return this.employeeService.findOne(id);
    }

    @Get('employees/:id/eosb')
    getEOSB(@Param('id') id: string, @Req() req: any) {
        return this.employeeService.calculateEndOfServiceBenefits(id);
    }

    @Post('employees')
    createEmployee(@Body() body: any, @Req() req: any) {
        return this.employeeService.create(body);
    }

    @Put('employees/:id')
    updateEmployee(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        return this.employeeService.update(id, body);
    }

    @Post('employees/:id/terminate')
    terminateEmployee(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        return this.employeeService.terminate(id, body);
    }

    // ============ DEPARTMENTS ============

    @Get('departments')
    getDepartments(@Req() req: any) {
        return this.employeeService.getDepartments();
    }

    @Post('departments')
    createDepartment(@Body() body: any, @Req() req: any) {
        return this.employeeService.createDepartment(body);
    }

    @Put('departments/:id')
    updateDepartment(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        return this.employeeService.updateDepartment(id, body);
    }

    // ============ ATTENDANCE ============

    @Post('attendance/clock-in')
    clockIn(@Body() body: any, @Req() req: any) {
        return this.attendanceService.clockIn(body.employeeId, body);
    }

    @Post('attendance/clock-out')
    clockOut(@Body() body: any, @Req() req: any) {
        return this.attendanceService.clockOut(body.employeeId);
    }

    @Get('attendance')
    getAttendance(@Req() req: any, @Query() query: any) {
        return this.attendanceService.getAttendance(query);
    }

    @Get('attendance/today/:employeeId')
    getTodayAttendance(@Param('employeeId') employeeId: string) {
        return this.attendanceService.getTodayStatus(employeeId);
    }

    @Post('attendance/mark-absent')
    markAbsent(@Body() body: any, @Req() req: any) {
        return this.attendanceService.markAbsent(body.date);
    }

    @Get('attendance/report')
    getAttendanceReport(@Req() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.attendanceService.getAttendanceReport(startDate, endDate);
    }

    @Get('attendance/settings')
    getAttendanceSettings(@Req() req: any) {
        return this.attendanceService.getSettings();
    }

    @Put('attendance/settings')
    updateAttendanceSettings(@Body() body: any, @Req() req: any) {
        return this.attendanceService.updateSettings(body);
    }

    // ============ LEAVE ============

    @Get('leave/types')
    getLeaveTypes(@Req() req: any) {
        return this.leaveService.getLeaveTypes();
    }

    @Post('leave/types')
    createLeaveType(@Body() body: any, @Req() req: any) {
        return this.leaveService.createLeaveType(body);
    }

    @Post('leave/types/initialize')
    initializeLeaveTypes(@Req() req: any) {
        return this.leaveService.initializeDefaultLeaveTypes();
    }

    @Get('leave/requests')
    getLeaveRequests(@Req() req: any, @Query() query: any) {
        return this.leaveService.getLeaveRequests(query);
    }

    @Post('leave/requests')
    submitLeaveRequest(@Body() body: any, @Req() req: any) {
        return this.leaveService.submitRequest(body.employeeId, body);
    }

    @Put('leave/requests/:id/review')
    reviewLeaveRequest(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        return this.leaveService.reviewRequest(id, req.user.id, body);
    }

    @Get('leave/balances/:employeeId')
    getEmployeeLeaveBalances(@Param('employeeId') employeeId: string, @Req() req: any) {
        return this.leaveService.getEmployeeBalances(employeeId);
    }

    // ============ PAYROLL ============

    @Post('payroll/generate')
    generatePayroll(@Body() body: any, @Req() req: any) {
        return this.payrollService.generateMonthlyPayroll(body.month, body.year);
    }

    @Get('payroll')
    getPayrolls(@Req() req: any, @Query() query: any) {
        return this.payrollService.getPayrolls(query);
    }

    @Put('payroll/:id/approve')
    approvePayroll(@Param('id') id: string, @Req() req: any) {
        return this.payrollService.approvePayroll(id, req.user.id);
    }

    @Put('payroll/:id/mark-paid')
    markPayrollPaid(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        return this.payrollService.markAsPaid(id, body);
    }

    @Get('payroll/report')
    getPayrollReport(@Req() req: any, @Query('month') month: string, @Query('year') year: string) {
        return this.payrollService.getPayrollReport(parseInt(month), parseInt(year));
    }

    @Get('payroll/bank-file')
    async getBankFile(@Req() req: any, @Query('month') month: string, @Query('year') year: string, @Res() res: Response) {
        const csv = await this.payrollService.generateBankFile(parseInt(month), parseInt(year));
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=payroll-${year}-${month}.csv`);
        res.send('\uFEFF' + csv); // BOM for Arabic
    }
}
