import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('Wasmaltheeqa Webhook')
@Controller('wasmaltheeqa')
export class WasmaltheeqaController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WhatsApp webhook endpoint' })
  async handleWebhook(@Body() body: any) {
    await this.whatsAppService.handleWebhook(body);
    return { status: 'ok' };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WhatsApp webhook verification' })
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'watheeq_verify_token';

    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }

    return 'Forbidden';
  }
}
