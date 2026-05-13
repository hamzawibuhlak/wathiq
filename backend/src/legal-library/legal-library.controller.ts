import { Controller, Get, Post, Delete, Patch, Param, Query, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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

        @CurrentUser() user: any,
    ) {
        return this.aiService.askAI(query, user.id);
    }

    // ── AI USAGE STATS ────────────────────────────
    @Get('ai-usage')
    getAIUsage(

        @CurrentUser() user: any,
    ) {
        return this.aiService.getUsageStats(user.id);
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

    @Post('regulations/upload-pdf')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
            fileFilter: (_req: any, file: any, cb: any) => {
                if (file.mimetype !== 'application/pdf') {
                    return cb(new BadRequestException('يجب أن يكون الملف بصيغة PDF'), false);
                }
                cb(null, true);
            } }),
    )
    async uploadRegulationPdf(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
    ) {
        if (!file) throw new BadRequestException('لم يتم رفع ملف');
        const metadata = {
            title: body.title || file.originalname.replace(/\.pdf$/i, ''),
            titleEn: body.titleEn,
            number: body.number,
            issuedBy: body.issuedBy,
            issuedDate: body.issuedDate,
            effectiveDate: body.effectiveDate,
            category: body.category || 'SYSTEM',
            status: body.status,
            tags: body.tags ? JSON.parse(body.tags) : undefined };
        return this.service.createRegulationFromPdf(file.buffer, metadata);
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
            search, page: page ? +page : 1 });
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

        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.aiService.createNote(articleId, user.id, data);
    }

    @Get('articles/:articleId/notes')
    getNotes(
        @Param('articleId') articleId: string,

        @CurrentUser() user: any,
    ) {
        return this.aiService.getNotes(articleId, user.id);
    }

    @Delete('notes/:id')
    deleteNote(
        @Param('id') id: string,

        @CurrentUser() user: any,
    ) {
        return this.aiService.deleteNote(id, user.id);
    }

    // ── BOOKMARKS ─────────────────────────────────
    @Get('bookmarks')
    getBookmarks(

        @CurrentUser() user: any,
        @Query('folderId') folderId?: string,
        @Query('tag') tag?: string,
    ) {
        return this.service.getBookmarks(user.id, folderId, tag);
    }

    @Post('bookmarks')
    addBookmark(

        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.addBookmark(user.id, data);
    }

    @Patch('bookmarks/:id')
    updateBookmark(
        @Param('id') id: string,

        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.updateBookmark(id, user.id, data);
    }

    @Delete('bookmarks/:id')
    removeBookmark(
        @Param('id') id: string,

        @CurrentUser() user: any,
    ) {
        return this.service.removeBookmark(id, user.id);
    }

    // ── BOOKMARK FOLDERS ──────────────────────────
    @Get('folders')
    getFolders(@CurrentUser() user: any) {
        return this.service.getFolders(user.id);
    }

    @Post('folders')
    createFolder(

        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.createFolder(user.id, data);
    }

    @Patch('folders/:id')
    updateFolder(
        @Param('id') id: string,

        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.updateFolder(id, user.id, data);
    }

    @Delete('folders/:id')
    deleteFolder(
        @Param('id') id: string,

        @CurrentUser() user: any,
    ) {
        return this.service.deleteFolder(id, user.id);
    }

    // ── FOLDER COMMENTS ───────────────────────────
    @Get('folders/:folderId/comments')
    getFolderComments(
        @Param('folderId') folderId: string,

    ) {
        return this.service.getFolderComments(folderId);
    }

    @Post('folders/:folderId/comments')
    addFolderComment(
        @Param('folderId') folderId: string,

        @CurrentUser() user: any,
        @Body('content') content: string,
    ) {
        return this.service.addFolderComment(folderId, user.id, content);
    }

    @Delete('folders/comments/:id')
    deleteFolderComment(
        @Param('id') id: string,

        @CurrentUser() user: any,
    ) {
        return this.service.deleteFolderComment(id, user.id);
    }

    // ── CASE REFERENCES ───────────────────────────
    @Post('cases/:caseId/references')
    linkToCase(
        @Param('caseId') caseId: string,

        @CurrentUser() user: any,
        @Body() data: any,
    ) {
        return this.service.linkToCase(caseId, user.id, data);
    }

    @Get('cases/:caseId/references')
    getCaseReferences(
        @Param('caseId') caseId: string,

    ) {
        return this.service.getCaseReferences(caseId);
    }
}
