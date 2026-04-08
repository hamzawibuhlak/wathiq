import {
  Controller,
  Get,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActivityLogsService } from './activity-logs.service';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@Controller('activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'الحصول على سجل النشاطات' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'userIds', required: false, type: String, description: 'Comma-separated user IDs' })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'entityId', required: false, type: String })
  @ApiQuery({ name: 'entityIds', required: false, type: String, description: 'Comma-separated entity IDs' })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'actions', required: false, type: String, description: 'Comma-separated actions' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('userId') userId?: string,
    @Query('userIds') userIdsStr?: string,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('entityIds') entityIdsStr?: string,
    @Query('action') action?: string,
    @Query('actions') actionsStr?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    const userIds = userIdsStr ? userIdsStr.split(',').filter(Boolean) : undefined;
    const entityIds = entityIdsStr ? entityIdsStr.split(',').filter(Boolean) : undefined;
    const actions = actionsStr ? actionsStr.split(',').filter(Boolean) : undefined;

    return this.activityLogsService.findAll({
      tenantId: user.tenantId,
      userId,
      userIds,
      entity,
      entityId,
      entityIds,
      action,
      actions,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get('export')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'تصدير سجل النشاطات كـ CSV' })
  async exportCsv(
    @Query('userId') userId?: string,
    @Query('userIds') userIdsStr?: string,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('entityIds') entityIdsStr?: string,
    @Query('action') action?: string,
    @Query('actions') actionsStr?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
    @Res() res?: Response,
  ) {
    const userIds = userIdsStr ? userIdsStr.split(',').filter(Boolean) : undefined;
    const entityIds = entityIdsStr ? entityIdsStr.split(',').filter(Boolean) : undefined;
    const actions = actionsStr ? actionsStr.split(',').filter(Boolean) : undefined;

    const csv = await this.activityLogsService.exportCsv({
      tenantId: user!.tenantId,
      userId,
      userIds,
      entity,
      entityId,
      entityIds,
      action,
      actions,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    const filename = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res!.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res!.send(csv);
  }

  @Get('stats')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'إحصائيات النشاطات' })
  async getStats(@CurrentUser() user: any) {
    const stats = await this.activityLogsService.getStats(user.tenantId);
    return { data: stats };
  }

  @Get('entity/:entity/:entityId')
  @Roles('OWNER', 'ADMIN', 'LAWYER')
  @ApiOperation({ summary: 'الحصول على سجل نشاطات كيان معين' })
  async getByEntity(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentUser() user: any,
  ) {
    const logs = await this.activityLogsService.getRecentByEntity(
      user.tenantId,
      entity,
      entityId,
      limit,
    );
    return { data: logs };
  }
}
