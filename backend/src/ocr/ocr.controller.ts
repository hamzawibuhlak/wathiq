import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OcrService } from './ocr.service';

@ApiTags('OCR')
@Controller('ocr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OcrController {
  constructor(private ocrService: OcrService) {}

  @Post('process/:documentId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN', 'LAWYER')
  @ApiOperation({ summary: 'Process document with OCR' })
  async processDocument(
    @Param('documentId') documentId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.ocrService.processDocument(documentId, user.tenantId);
    return { message: 'OCR processing completed', data: result };
  }

  @Post('batch')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Batch process multiple documents' })
  async batchProcess(
    @Body() body: { documentIds: string[] },
    @CurrentUser() user: any,
  ) {
    const results = await this.ocrService.batchProcess(body.documentIds, user.tenantId);
    return { message: 'Batch processing completed', data: results };
  }

  @Post('retry-failed')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Retry all failed OCR documents' })
  async retryFailed(@CurrentUser() user: any) {
    const results = await this.ocrService.retryFailed(user.tenantId);
    return { message: 'Retry processing completed', data: results };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get OCR statistics' })
  async getStats(@CurrentUser() user: any) {
    const stats = await this.ocrService.getStats(user.tenantId);
    return { data: stats };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search in OCR text' })
  async searchInOcrText(
    @Query('q') query: string,
    @Query('limit') limit: number,
    @CurrentUser() user: any,
  ) {
    const results = await this.ocrService.searchInOcrText(
      query,
      user.tenantId,
      limit || 20,
    );
    return { data: results };
  }
}
