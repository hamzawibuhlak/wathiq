import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AiConfigService } from './ai-config.service';

@ApiTags('AI Configuration')
@ApiBearerAuth()
@Controller('ai/config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiConfigController {
  constructor(private readonly aiConfigService: AiConfigService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'الحصول على إعدادات الذكاء الاصطناعي' })
  async getConfig() {
    const data = await this.aiConfigService.getFullConfig();
    return { data };
  }

  @Patch()
  @Roles('OWNER')
  @ApiOperation({ summary: 'تحديث إعدادات الذكاء الاصطناعي' })
  async updateConfig(
    @Body()
    body: {
      provider?: string;
      openaiApiKey?: string;
      openaiModel?: string;
      anthropicApiKey?: string;
      anthropicModel?: string;
      openrouterApiKey?: string;
      openrouterModel?: string;
    },
  ) {
    const data = await this.aiConfigService.updateConfig(body);
    return { message: 'تم الحفظ بنجاح', data };
  }

  @Post('test')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'اختبار اتصال الذكاء الاصطناعي' })
  async testConnection(@Body() body: { provider: string }) {
    return this.aiConfigService.testConnection(body.provider);
  }

  @Get('prompts')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'الحصول على جميع برومتات النظام' })
  async getPrompts() {
    const data = await this.aiConfigService.getAllPrompts();
    return { data };
  }

  @Patch('prompts/:key')
  @Roles('OWNER')
  @ApiOperation({ summary: 'تحديث برومت نظام معيّن' })
  async updatePrompt(@Param('key') key: string, @Body() body: { prompt: string }) {
    await this.aiConfigService.updatePrompt(key, body.prompt);
    return { message: 'تم التحديث' };
  }

  @Delete('prompts/:key')
  @Roles('OWNER')
  @ApiOperation({ summary: 'إعادة برومت لقيمته الافتراضية' })
  async resetPrompt(@Param('key') key: string) {
    const data = await this.aiConfigService.resetPrompt(key);
    return { message: 'تمت الاستعادة للوضع الافتراضي', data };
  }
}
