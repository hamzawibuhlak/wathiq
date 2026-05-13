import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LegalDocumentsService } from './legal-documents.service';

@ApiTags('Legal Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('legal-documents')
export class LegalDocumentsController {
    constructor(private service: LegalDocumentsService) { }

    // ── CRUD ──────────────────────────────────────
    @Get()
    findAll(
        @CurrentUser() user: any,
        @Query('type') type?: string,
        @Query('status') status?: string,
        @Query('caseId') caseId?: string,
        @Query('search') search?: string,
        @Query('page') page?: number,
    ) {
        return this.service.findAll({ type, status, caseId, search, page: page ? Number(page) : undefined });
    }

    @Get('templates/list')
    getTemplates(
        @CurrentUser() user: any,
        @Query('type') type?: string,
    ) {
        return this.service.getTemplates(type);
    }

    @Get('search/query')
    search(@Query('q') q: string, @CurrentUser() user: any) {
        return this.service.search(q);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.service.findOne(id);
    }

    @Get(':id/export/html')
    async exportHtml(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Res() res: Response,
    ) {
        const html = await this.service.getExportHtml(id);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }

    @Post()
    create(
        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.create(user.id, data);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.update(id, user.id, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @CurrentUser() user: any) {
        return this.service.delete(id);
    }

    @Post(':id/duplicate')
    duplicate(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.service.duplicate(id, user.id);
    }

    // ── VERSION HISTORY ───────────────────────────
    @Post(':id/restore/:versionId')
    restoreVersion(
        @Param('id') id: string,
        @Param('versionId') versionId: string,
        @CurrentUser() user: any,
    ) {
        return this.service.restoreVersion(id, versionId, user.id);
    }

    // ── TEMPLATES ─────────────────────────────────
    @Post('templates')
    createTemplate(
        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.createTemplate(data);
    }

    // ── AI ────────────────────────────────────────
    @Post('ai/generate')
    generateWithAI(
        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.generateWithAI(data);
    }
}
