import {
    Controller, Get, Post, Delete, Patch,
    Param, Query, Body, UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { LegalLibraryService } from './legal-library.service';
import { LegalAIService } from './legal-ai.service';

@UseGuards(JwtAuthGuard)
@Controller('legal-library')
export class LegalLibraryController {
    constructor(
        private service: LegalLibraryService,
        private aiService: LegalAIService,
    ) { }

    // ── STATS ─────────────────────────────────────
    @Get('stats')
    getStats() {
        return this.service.getStats();
    }

    // ── GLOBAL SEARCH ─────────────────────────────
    @Get('search')
    globalSearch(@Query('q') q: string) {
        return this.service.globalSearch(q);
    }

    // ── AI SMART SEARCH ───────────────────────────
    @Post('ai-search')
    aiSearch(
        @Body('query') query: string,
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
    ) {
        return this.aiService.askAI(query, tenantId, user.id);
    }

    // ── AI USAGE STATS ────────────────────────────
    @Get('ai-usage')
    getAIUsage(
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
    ) {
        return this.aiService.getUsageStats(tenantId, user.id);
    }

    // ── REGULATIONS ───────────────────────────────
    @Get('regulations')
    getRegulations(
        @Query('category') category?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('page') page?: number,
    ) {
        return this.service.getRegulations({ category, status, search, page: page ? +page : 1 });
    }

    @Get('regulations/:id')
    getRegulationById(@Param('id') id: string) {
        return this.service.getRegulationById(id);
    }

    @Post('regulations')
    createRegulation(@Body() data: any) {
        return this.service.createRegulation(data);
    }

    @Delete('regulations/:id')
    deleteRegulation(@Param('id') id: string) {
        return this.service.deleteRegulation(id);
    }

    @Patch('regulations/:id')
    updateRegulation(@Param('id') id: string, @Body() data: any) {
        return this.service.updateRegulation(id, data);
    }

    // ── PRECEDENTS ────────────────────────────────
    @Get('precedents')
    getPrecedents(
        @Query('courtType') courtType?: string,
        @Query('caseType') caseType?: string,
        @Query('outcome') outcome?: string,
        @Query('yearFrom') yearFrom?: number,
        @Query('yearTo') yearTo?: number,
        @Query('search') search?: string,
        @Query('page') page?: number,
    ) {
        return this.service.getPrecedents({
            courtType, caseType, outcome,
            yearFrom: yearFrom ? +yearFrom : undefined,
            yearTo: yearTo ? +yearTo : undefined,
            search, page: page ? +page : 1,
        });
    }

    @Get('precedents/:id')
    getPrecedentById(@Param('id') id: string) {
        return this.service.getPrecedentById(id);
    }

    @Post('precedents')
    createPrecedent(@Body() data: any) {
        return this.service.createPrecedent(data);
    }

    @Patch('precedents/:id')
    updatePrecedent(@Param('id') id: string, @Body() data: any) {
        return this.service.updatePrecedent(id, data);
    }

    @Delete('precedents/:id')
    deletePrecedent(@Param('id') id: string) {
        return this.service.deletePrecedent(id);
    }

    // ── GLOSSARY ──────────────────────────────────
    @Get('terms')
    getTerms(
        @Query('search') search?: string,
        @Query('category') category?: string,
        @Query('letter') letter?: string,
    ) {
        return this.service.getTerms({ search, category, letter });
    }

    @Get('terms/:id')
    getTermById(@Param('id') id: string) {
        return this.service.getTermById(id);
    }

    @Post('terms')
    createTerm(@Body() data: any) {
        return this.service.createTerm(data);
    }

    @Patch('terms/:id')
    updateTerm(@Param('id') id: string, @Body() data: any) {
        return this.service.updateTerm(id, data);
    }

    @Delete('terms/:id')
    deleteTerm(@Param('id') id: string) {
        return this.service.deleteTerm(id);
    }

    // ── ARTICLE NOTES ─────────────────────────────
    @Post('articles/:articleId/notes')
    createNote(
        @Param('articleId') articleId: string,
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.aiService.createNote(articleId, tenantId, user.id, data);
    }

    @Get('articles/:articleId/notes')
    getNotes(
        @Param('articleId') articleId: string,
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
    ) {
        return this.aiService.getNotes(articleId, tenantId, user.id);
    }

    @Delete('notes/:id')
    deleteNote(
        @Param('id') id: string,
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
    ) {
        return this.aiService.deleteNote(id, tenantId, user.id);
    }

    // ── BOOKMARKS ─────────────────────────────────
    @Get('bookmarks')
    getBookmarks(
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
        @Query('folderId') folderId?: string,
    ) {
        return this.service.getBookmarks(tenantId, user.id, folderId);
    }

    @Post('bookmarks')
    addBookmark(
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.addBookmark(tenantId, user.id, data);
    }

    @Delete('bookmarks/:id')
    removeBookmark(
        @Param('id') id: string,
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
    ) {
        return this.service.removeBookmark(id, tenantId, user.id);
    }

    // ── BOOKMARK FOLDERS ──────────────────────────
    @Get('folders')
    getFolders(@TenantId() tenantId: string, @CurrentUser() user: any) {
        return this.service.getFolders(tenantId, user.id);
    }

    @Post('folders')
    createFolder(
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.createFolder(tenantId, user.id, data);
    }

    // ── CASE REFERENCES ───────────────────────────
    @Post('cases/:caseId/references')
    linkToCase(
        @Param('caseId') caseId: string,
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.linkToCase(caseId, tenantId, user.id, data);
    }

    @Get('cases/:caseId/references')
    getCaseReferences(
        @Param('caseId') caseId: string,
        @TenantId() tenantId: string,
    ) {
        return this.service.getCaseReferences(caseId, tenantId);
    }
}
