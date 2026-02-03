import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExportsService } from './exports.service';

@ApiTags('Exports')
@ApiBearerAuth()
@Controller('exports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('cases')
  @Roles('OWNER', 'ADMIN', 'LAWYER')
  @ApiOperation({ summary: 'تصدير القضايا إلى Excel' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'ids', required: false, description: 'Comma-separated list of case IDs to export' })
  async exportCases(
    @CurrentUser() user: any,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('ids') ids?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (ids) filters.ids = ids.split(',').map(id => id.trim());

    const buffer = await this.exportsService.exportCases(user.tenantId, filters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=cases-${new Date().getTime()}.xlsx`,
    );

    res.send(buffer);
  }

  @Get('invoices')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'تصدير الفواتير إلى Excel' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'ids', required: false, description: 'Comma-separated list of invoice IDs to export' })
  async exportInvoices(
    @CurrentUser() user: any,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('ids') ids?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (ids) filters.ids = ids.split(',').map(id => id.trim());

    const buffer = await this.exportsService.exportInvoices(
      user.tenantId,
      filters,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoices-${new Date().getTime()}.xlsx`,
    );

    res.send(buffer);
  }

  @Get('clients')
  @Roles('OWNER', 'ADMIN', 'LAWYER')
  @ApiOperation({ summary: 'تصدير العملاء إلى Excel' })
  @ApiQuery({ name: 'ids', required: false, description: 'Comma-separated list of client IDs to export' })
  async exportClients(
    @CurrentUser() user: any,
    @Res() res: Response,
    @Query('ids') ids?: string,
  ) {
    const filters: any = {};
    if (ids) filters.ids = ids.split(',').map(id => id.trim());

    const buffer = await this.exportsService.exportClients(user.tenantId, filters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=clients-${new Date().getTime()}.xlsx`,
    );

    res.send(buffer);
  }

  @Get('hearings')
  @Roles('OWNER', 'ADMIN', 'LAWYER')
  @ApiOperation({ summary: 'تصدير الجلسات إلى Excel' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'ids', required: false, description: 'Comma-separated list of hearing IDs to export' })
  async exportHearings(
    @CurrentUser() user: any,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('ids') ids?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (ids) filters.ids = ids.split(',').map(id => id.trim());

    const buffer = await this.exportsService.exportHearings(
      user.tenantId,
      filters,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=hearings-${new Date().getTime()}.xlsx`,
    );

    res.send(buffer);
  }

  @Get('financial-report')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'تصدير التقرير المالي' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Default: 30 days ago' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Default: today' })
  async exportFinancialReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    // Default to last 30 days if not provided
    const now = new Date();
    let end: Date;
    let start: Date;
    
    if (endDate && endDate.trim()) {
      end = new Date(endDate);
    } else {
      end = now;
    }
    
    if (startDate && startDate.trim()) {
      start = new Date(startDate);
    } else {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Ensure valid dates
    if (isNaN(end.getTime())) end = now;
    if (isNaN(start.getTime())) start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const buffer = await this.exportsService.exportFinancialReport(
      user.tenantId,
      start,
      end,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=financial-report-${new Date().getTime()}.xlsx`,
    );

    res.send(buffer);
  }
}
