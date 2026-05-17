import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('Wasmaltheeqa Webhook')
@Controller('wasmaltheeqa')
export class WasmaltheeqaController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Get()
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

  @Post()
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
}
