import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PermissionsService } from './permissions.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('my-permissions')
  @ApiOperation({ summary: 'الحصول على صلاحيات المستخدم الحالي' })
  async getMyPermissions(@CurrentUser() user: any) {
    const permissions = await this.permissionsService.getUserPermissions(
      user.userId,
      user.tenantId,
    );
    return { data: permissions };
  }

  @Get('all')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'الحصول على جميع الصلاحيات المتاحة' })
  async getAllPermissions() {
    const permissions = await this.permissionsService.getAllPermissions();
    return { data: permissions };
  }

  @Get('role/:role')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'الحصول على صلاحيات دور معين' })
  async getRolePermissions(
    @Param('role') role: string,
    @CurrentUser() user: any,
  ) {
    const permissions = await this.permissionsService.getRolePermissions(
      role,
      user.tenantId,
    );
    return { data: permissions };
  }

  @Get('defaults/:role')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'الحصول على الصلاحيات الافتراضية لدور' })
  async getDefaultPermissions(@Param('role') role: string) {
    const defaults = await this.permissionsService.getDefaultPermissionsForRole(role);
    return { data: defaults };
  }

  @Post('assign')
  @Roles('OWNER')
  @ApiOperation({ summary: 'منح صلاحية لدور' })
  async assignPermission(
    @Body() body: { role: string; permission: string },
    @CurrentUser() user: any,
  ) {
    await this.permissionsService.assignPermission(
      body.role,
      body.permission,
      user.tenantId,
    );
    return { message: 'تم منح الصلاحية بنجاح' };
  }

  @Delete('revoke')
  @Roles('OWNER')
  @ApiOperation({ summary: 'إلغاء صلاحية من دور' })
  async revokePermission(
    @Body() body: { role: string; permission: string },
    @CurrentUser() user: any,
  ) {
    await this.permissionsService.revokePermission(
      body.role,
      body.permission,
      user.tenantId,
    );
    return { message: 'تم إلغاء الصلاحية بنجاح' };
  }
}
