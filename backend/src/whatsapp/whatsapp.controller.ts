import { Controller, Get, Post, Patch, Body, Query, Param, Req, Res, UseGuards, DefaultValuePipe, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WhatsAppService } from './whatsapp.service';
import { WhatsappBaileysService } from './whatsapp-baileys.service';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly baileysService: WhatsappBaileysService,
  ) { }

  // =====================================================
  // SETTINGS (Cloud API)
  // =====================================================

  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على إعدادات الواتساب' })
  async getSettings(@CurrentUser() user: any) {
    const settings = await this.whatsAppService.getSettings();
    return { data: settings };
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث إعدادات الواتساب' })
  async updateSettings(
    @Body()
    body: {
      whatsappAccessToken?: string;
      whatsappPhoneNumberId?: string;
      whatsappBusinessId?: string;
      whatsappWebhookToken?: string;
      whatsappEnabled?: boolean;
    },
    @CurrentUser() user: any,
  ) {
    const settings = await this.whatsAppService.updateSettings(body);
    return { message: 'تم تحديث الإعدادات بنجاح', data: settings };
  }

  @Post('test-connection')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'اختبار اتصال الواتساب' })
  async testConnection(@CurrentUser() user: any) {
    const result = await this.whatsAppService.testConnection();
    return result;
  }

  // =====================================================
  // MESSAGING (Cloud API)
  // =====================================================

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'LAWYER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إرسال رسالة واتساب' })
  async sendMessage(
    @Body()
    body: {
      to?: string;
      phone?: string;
      message?: string;
      body?: string;
      clientId?: string;
      caseId?: string;
    },
    @CurrentUser() user: any,
  ) {
    const phoneNumber = body.to || body.phone;
    const messageText = body.body || body.message;

    if (!phoneNumber) {
      throw new Error('رقم الهاتف مطلوب');
    }
    if (!messageText) {
      throw new Error('نص الرسالة مطلوب');
    }

    const message = await this.whatsAppService.sendTextMessage({
      to: phoneNumber,
      body: messageText,

      clientId: body.clientId,
      caseId: body.caseId });

    return { message: 'تم إرسال الرسالة بنجاح', data: message };
  }

  @Post('send-hearing-reminder/:hearingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'LAWYER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إرسال تذكير بموعد جلسة' })
  async sendHearingReminder(
    @Param('hearingId') hearingId: string,
    @CurrentUser() user: any,
  ) {
    await this.whatsAppService.sendHearingReminder(hearingId);
    return { message: 'تم إرسال التذكير بنجاح' };
  }

  @Post('send-invoice-reminder/:invoiceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إرسال تذكير بسداد فاتورة' })
  async sendInvoiceReminder(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: any,
  ) {
    await this.whatsAppService.sendInvoiceReminder(invoiceId);
    return { message: 'تم إرسال التذكير بنجاح' };
  }

  @Get('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على رسائل واتساب' })
  async getMessages(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('clientId') clientId: string,
    @CurrentUser() user: any,
  ) {
    return this.whatsAppService.getMessages({

      clientId,
      page,
      limit });
  }

  @Get('conversation/:clientId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على محادثة مع عميل' })
  async getConversation(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
  ) {
    const conversation = await this.whatsAppService.getConversation(
      clientId,

    );
    return { data: conversation };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إحصائيات واتساب' })
  async getStats(@CurrentUser() user: any) {
    const stats = await this.whatsAppService.getStats();
    return { data: stats };
  }

  @Get('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WhatsApp webhook verification (Meta handshake)' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken =
      process.env.WHATSAPP_VERIFY_TOKEN || 'watheeq_verify_token';
    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WhatsApp webhook — استقبال الرسائل والحالات' })
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers['x-hub-signature-256'] as string;
    const rawBody = (req as any).rawBody as Buffer | undefined;

    if (rawBody && signature) {
      const isValid = this.whatsAppService.verifySignature(rawBody, signature);
      if (!isValid) {
        return res.sendStatus(403);
      }
    }

    try {
      await this.whatsAppService.handleWebhook(req.body);
    } catch {
      // Always return 200 so Meta doesn't retry
    }
    return res.status(200).send('EVENT_RECEIVED');
  }

  // =====================================================
  // BAILEYS QR — Phase 32
  // =====================================================

  @Post('qr/connect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'بدء جلسة واتساب عبر QR (Baileys)' })
  async qrConnect(@CurrentUser() user: any) {
    return this.baileysService.initSession();
  }

  @Post('qr/disconnect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'قطع اتصال واتساب QR' })
  async qrDisconnect(@CurrentUser() user: any) {
    return this.baileysService.disconnect();
  }

  @Get('qr/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حالة جلسة واتساب QR' })
  async qrStatus(@CurrentUser() user: any) {
    const status = await this.baileysService.getSessionStatus();
    return { data: status };
  }

  @Post('qr/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إرسال رسالة عبر واتساب QR' })
  async qrSend(
    @Body() body: { phone: string; message: string },
    @CurrentUser() user: any,
  ) {
    return this.baileysService.sendMessage(

      body.phone,
      body.message,
      user.id,
    );
  }

  @Get('qr/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'سجل رسائل واتساب QR' })
  async qrMessages(
    @Query('phone') phone: string,
    @Query('clientId') clientId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @CurrentUser() user: any,
  ) {
    return this.baileysService.getMessages({
      phone,
      clientId,
      page });
  }
}
