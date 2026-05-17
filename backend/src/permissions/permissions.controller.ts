import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
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

  // ── Read endpoints ─────────────────────────────────────
  @Get('my-permissions')
  @ApiOperation({ summary: 'الحصول على صلاحيات المستخدم الحالي' })
  async getMyPermissions(@CurrentUser() user: any) {
    const permissions = await this.permissionsService.getUserPermissions(user.userId);
    return { data: permissions };
  }

  @Get('all')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'الحصول على جميع الصلاحيات' })
  async getAllPermissions() {
    const permissions = await this.permissionsService.getAllPermissions();
    return { data: permissions };
  }

  @Get('categories')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'الحصول على تصنيفات الصلاحيات' })
  async getCategories() {
    const data = await this.permissionsService.getCategories();
    return { data };
  }

  @Get('role/:role')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'الحصول على صلاحيات دور معين' })
  async getRolePermissions(@Param('role') role: string) {
    const permissions = await this.permissionsService.getRolePermissions(role);
    return { data: permissions };
  }

  @Get('defaults/:role')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'الحصول على الصلاحيات الافتراضية لدور' })
  async getDefaultPermissions(@Param('role') role: string) {
    const defaults = await this.permissionsService.getDefaultPermissionsForRole(role);
    return { data: defaults };
  }

  // ── Assign / Revoke ────────────────────────────────────
  @Post('assign')
  @Roles('OWNER')
  @ApiOperation({ summary: 'منح صلاحية لدور' })
  async assignPermission(@Body() body: { role: string; permission: string }) {
    await this.permissionsService.assignPermission(body.role, body.permission);
    return { message: 'تم منح الصلاحية بنجاح' };
  }

  @Delete('revoke')
  @Roles('OWNER')
  @ApiOperation({ summary: 'إلغاء صلاحية من دور' })
  async revokePermission(@Body() body: { role: string; permission: string }) {
    await this.permissionsService.revokePermission(body.role, body.permission);
    return { message: 'تم إلغاء الصلاحية بنجاح' };
  }

  @Post('bulk-assign')
  @Roles('OWNER')
  @ApiOperation({ summary: 'منح عدة صلاحيات لدور دفعة واحدة' })
  async bulkAssign(@Body() body: { role: string; permissions: string[] }) {
    const result = await this.permissionsService.bulkAssign(body.role, body.permissions);
    return { message: `تم منح ${result.count} صلاحية`, ...result };
  }

  @Post('bulk-revoke')
  @Roles('OWNER')
  @ApiOperation({ summary: 'إلغاء عدة صلاحيات من دور دفعة واحدة' })
  async bulkRevoke(@Body() body: { role: string; permissions: string[] }) {
    const result = await this.permissionsService.bulkRevoke(body.role, body.permissions);
    return { message: `تم إلغاء ${result.count} صلاحية`, ...result };
  }

  @Post('reset/:role')
  @Roles('OWNER')
  @ApiOperation({ summary: 'إعادة ضبط صلاحيات دور للقيم الافتراضية' })
  async resetRole(@Param('role') role: string) {
    await this.permissionsService.applyDefaults(role);
    return { message: 'تم إعادة الضبط بنجاح' };
  }

  @Post('clear/:role')
  @Roles('OWNER')
  @ApiOperation({ summary: 'مسح جميع صلاحيات دور' })
  async clearRole(@Param('role') role: string) {
    const result = await this.permissionsService.clearRole(role);
    return { message: `تم مسح ${result.count} صلاحية`, ...result };
  }

  // ── Custom permission CRUD ─────────────────────────────
  @Post()
  @Roles('OWNER')
  @ApiOperation({ summary: 'إضافة صلاحية مخصصة جديدة' })
  async createCustomPermission(
    @Body()
    body: {
      module: string;
      action: string;
      labelAr?: string;
      description?: string;
      category?: string;
    },
  ) {
    const permission = await this.permissionsService.createCustomPermission(body);
    return { message: 'تمت إضافة الصلاحية بنجاح', data: permission };
  }

  @Patch(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'تحديث وصف صلاحية' })
  async updatePermission(
    @Param('id') id: string,
    @Body() body: { labelAr?: string; description?: string; category?: string },
  ) {
    const permission = await this.permissionsService.updatePermission(id, body);
    return { message: 'تم التحديث', data: permission };
  }

  @Delete(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'حذف صلاحية مخصصة (غير قابل للحذف للصلاحيات الأساسية)' })
  async deletePermission(@Param('id') id: string) {
    await this.permissionsService.deletePermission(id);
    return { message: 'تم الحذف بنجاح' };
  }
}
