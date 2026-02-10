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
        return this.employeeService.findAll(req.user.tenantId, query);
    }

    @Get('employees/statistics')
    getStatistics(@Req() req: any) {
        return this.employeeService.getStatistics(req.user.tenantId);
    }

    @Get('employees/org-chart')
    getOrgChart(@Req() req: any) {
        return this.employeeService.getOrganizationChart(req.user.tenantId);
    }

    @Get('employees/:id')
    getEmployee(@Param('id') id: string, @Req() req: any) {
        return this.employeeService.findOne(id, req.user.tenantId);
    }

    @Get('employees/:id/eosb')
    getEOSB(@Param('id') id: string, @Req() req: any) {
        return this.employeeService.calculateEndOfServiceBenefits(id, req.user.tenantId);
    }

    @Post('employees')
    createEmployee(@Body() body: any, @Req() req: any) {
        return this.employeeService.create(req.user.tenantId, body);
    }

    @Put('employees/:id')
    updateEmployee(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        return this.employeeService.update(id, req.user.tenantId, body);
    }

    @Post('employees/:id/terminate')
    terminateEmployee(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        return this.employeeService.terminate(id, req.user.tenantId, body);
    }

    // ============ DEPARTMENTS ============

    @Get('departments')
    getDepartments(@Req() req: any) {
        return this.employeeService.getDepartments(req.user.tenantId);
    }

    @Post('departments')
    createDepartment(@Body() body: any, @Req() req: any) {
        return this.employeeService.createDepartment(req.user.tenantId, body);
    }

    @Put('departments/:id')
    updateDepartment(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        return this.employeeService.updateDepartment(id, req.user.tenantId, body);
    }

    // ============ ATTENDANCE ============

    @Post('attendance/clock-in')
    clockIn(@Body() body: any, @Req() req: any) {
        return this.attendanceService.clockIn(body.employeeId, req.user.tenantId, body);
    }

    @Post('attendance/clock-out')
    clockOut(@Body() body: any, @Req() req: any) {
        return this.attendanceService.clockOut(body.employeeId, req.user.tenantId);
    }

    @Get('attendance')
    getAttendance(@Req() req: any, @Query() query: any) {
        return this.attendanceService.getAttendance(req.user.tenantId, query);
    }

    @Get('attendance/today/:employeeId')
    getTodayAttendance(@Param('employeeId') employeeId: string) {
        return this.attendanceService.getTodayStatus(employeeId);
    }

    @Post('attendance/mark-absent')
    markAbsent(@Body() body: any, @Req() req: any) {
        return this.attendanceService.markAbsent(req.user.tenantId, body.date);
    }

    @Get('attendance/report')
    getAttendanceReport(@Req() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.attendanceService.getAttendanceReport(req.user.tenantId, startDate, endDate);
    }

    @Get('attendance/settings')
    getAttendanceSettings(@Req() req: any) {
        return this.attendanceService.getSettings(req.user.tenantId);
    }

    @Put('attendance/settings')
    updateAttendanceSettings(@Body() body: any, @Req() req: any) {
        return this.attendanceService.updateSettings(req.user.tenantId, body);
    }

    // ============ LEAVE ============

    @Get('leave/types')
    getLeaveTypes(@Req() req: any) {
        return this.leaveService.getLeaveTypes(req.user.tenantId);
    }

    @Post('leave/types')
    createLeaveType(@Body() body: any, @Req() req: any) {
        return this.leaveService.createLeaveType(req.user.tenantId, body);
    }

    @Post('leave/types/initialize')
    initializeLeaveTypes(@Req() req: any) {
        return this.leaveService.initializeDefaultLeaveTypes(req.user.tenantId);
    }

    @Get('leave/requests')
    getLeaveRequests(@Req() req: any, @Query() query: any) {
        return this.leaveService.getLeaveRequests(req.user.tenantId, query);
    }

    @Post('leave/requests')
    submitLeaveRequest(@Body() body: any, @Req() req: any) {
        return this.leaveService.submitRequest(body.employeeId, req.user.tenantId, body);
    }

    @Put('leave/requests/:id/review')
    reviewLeaveRequest(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        return this.leaveService.reviewRequest(id, req.user.tenantId, req.user.id, body);
    }

    @Get('leave/balances/:employeeId')
    getEmployeeLeaveBalances(@Param('employeeId') employeeId: string, @Req() req: any) {
        return this.leaveService.getEmployeeBalances(employeeId, req.user.tenantId);
    }

    // ============ PAYROLL ============

    @Post('payroll/generate')
    generatePayroll(@Body() body: any, @Req() req: any) {
        return this.payrollService.generateMonthlyPayroll(req.user.tenantId, body.month, body.year);
    }

    @Get('payroll')
    getPayrolls(@Req() req: any, @Query() query: any) {
        return this.payrollService.getPayrolls(req.user.tenantId, query);
    }

    @Put('payroll/:id/approve')
    approvePayroll(@Param('id') id: string, @Req() req: any) {
        return this.payrollService.approvePayroll(id, req.user.id, req.user.tenantId);
    }

    @Put('payroll/:id/mark-paid')
    markPayrollPaid(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        return this.payrollService.markAsPaid(id, req.user.tenantId, body);
    }

    @Get('payroll/report')
    getPayrollReport(@Req() req: any, @Query('month') month: string, @Query('year') year: string) {
        return this.payrollService.getPayrollReport(req.user.tenantId, parseInt(month), parseInt(year));
    }

    @Get('payroll/bank-file')
    async getBankFile(@Req() req: any, @Query('month') month: string, @Query('year') year: string, @Res() res: Response) {
        const csv = await this.payrollService.generateBankFile(req.user.tenantId, parseInt(month), parseInt(year));
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=payroll-${year}-${month}.csv`);
        res.send('\uFEFF' + csv); // BOM for Arabic
    }
}
