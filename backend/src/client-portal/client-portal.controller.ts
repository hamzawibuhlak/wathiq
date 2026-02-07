import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientPortalService } from './client-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClientPortalGuard } from './guards/client-portal.guard';

@ApiTags('Client Portal')
@Controller('client-portal')
export class ClientPortalController {
  constructor(private readonly clientPortalService: ClientPortalService) {}

  // =====================================================
  // Admin endpoints (for enabling/disabling portal access)
  // =====================================================

  @Post('enable/:clientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تفعيل بوابة العملاء لعميل معين' })
  async enablePortalAccess(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
  ) {
    return this.clientPortalService.enablePortalAccess(
      clientId,
      user.tenantId,
    );
  }

  @Post('disable/:clientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تعطيل بوابة العملاء لعميل معين' })
  async disablePortalAccess(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
  ) {
    return this.clientPortalService.disablePortalAccess(
      clientId,
      user.tenantId,
    );
  }

  // =====================================================
  // Public endpoints (for client login)
  // =====================================================

  @Post('login')
  @ApiOperation({ summary: 'تسجيل دخول العميل' })
  async login(@Body() body: { phone: string; password: string }) {
    return this.clientPortalService.login(body.phone, body.password);
  }

  // =====================================================
  // Protected client endpoints
  // =====================================================

  @Post('change-password')
  @UseGuards(ClientPortalGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تغيير كلمة المرور' })
  async changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @Req() req: any,
  ) {
    return this.clientPortalService.changePassword(
      req.client.clientId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Get('profile')
  @UseGuards(ClientPortalGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على بيانات العميل' })
  async getProfile(@Req() req: any) {
    const profile = await this.clientPortalService.getProfile(
      req.client.clientId,
      req.client.tenantId,
    );
    return { data: profile };
  }

  @Get('dashboard')
  @UseGuards(ClientPortalGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إحصائيات لوحة التحكم' })
  async getDashboard(@Req() req: any) {
    const stats = await this.clientPortalService.getDashboardStats(
      req.client.clientId,
      req.client.tenantId,
    );
    return { data: stats };
  }

  @Get('my-cases')
  @UseGuards(ClientPortalGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على قضايا العميل' })
  async getMyCases(@Req() req: any) {
    const cases = await this.clientPortalService.getMyCases(
      req.client.clientId,
      req.client.tenantId,
    );
    return { data: cases };
  }

  @Get('cases/:caseId')
  @UseGuards(ClientPortalGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على تفاصيل قضية' })
  async getCaseDetails(
    @Param('caseId') caseId: string,
    @Req() req: any,
  ) {
    const caseData = await this.clientPortalService.getCaseDetails(
      caseId,
      req.client.clientId,
      req.client.tenantId,
    );
    return { data: caseData };
  }

  @Get('my-invoices')
  @UseGuards(ClientPortalGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على فواتير العميل' })
  async getMyInvoices(@Req() req: any) {
    const invoices = await this.clientPortalService.getMyInvoices(
      req.client.clientId,
      req.client.tenantId,
    );
    return { data: invoices };
  }

  @Get('invoices/:invoiceId')
  @UseGuards(ClientPortalGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على تفاصيل فاتورة' })
  async getInvoiceDetails(
    @Param('invoiceId') invoiceId: string,
    @Req() req: any,
  ) {
    const invoice = await this.clientPortalService.getInvoiceDetails(
      invoiceId,
      req.client.clientId,
      req.client.tenantId,
    );
    return { data: invoice };
  }

  @Get('my-documents')
  @UseGuards(ClientPortalGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على مستندات العميل' })
  async getMyDocuments(
    @Query('caseId') caseId: string,
    @Req() req: any,
  ) {
    const documents = await this.clientPortalService.getMyDocuments(
      req.client.clientId,
      req.client.tenantId,
      caseId,
    );
    return { data: documents };
  }

  @Get('upcoming-hearings')
  @UseGuards(ClientPortalGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على الجلسات القادمة' })
  async getUpcomingHearings(@Req() req: any) {
    const hearings = await this.clientPortalService.getUpcomingHearings(
      req.client.clientId,
      req.client.tenantId,
    );
    return { data: hearings };
  }
}
