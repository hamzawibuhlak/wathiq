import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller()
export class FormsController {
    constructor(private readonly formsService: FormsService) { }

    // ══════════════════════════════════════════════════════════
    // PROTECTED ENDPOINTS (require auth)
    // ══════════════════════════════════════════════════════════

    @UseGuards(JwtAuthGuard)
    @Post('forms')
    async create(@Req() req: Request, @Body() body: any) {
        const user = req.user as any;
        return this.formsService.create(user.tenantId, user.id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('forms')
    async findAll(@Req() req: Request, @Query() query: any) {
        const user = req.user as any;
        return this.formsService.findAll(user.tenantId, user.id, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('forms/editor/answers')
    async getEditorAnswers(@Req() req: Request, @Query() query: any) {
        const user = req.user as any;
        return this.formsService.getAnswersForEditor(user.tenantId, user.id, {
            caseId: query.caseId,
            clientId: query.clientId,
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get('forms/:id')
    async findById(@Req() req: Request, @Param('id') id: string) {
        const user = req.user as any;
        return this.formsService.findById(id, user.tenantId, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Put('forms/:id')
    async update(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
        const user = req.user as any;
        return this.formsService.update(id, user.tenantId, user.id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('forms/:id')
    async delete(@Req() req: Request, @Param('id') id: string) {
        const user = req.user as any;
        return this.formsService.delete(id, user.tenantId, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Put('forms/:id/access')
    async manageAccess(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
        const user = req.user as any;
        return this.formsService.manageAccess(id, user.tenantId, user.id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Post('forms/:id/otp')
    async generateOtp(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
        const user = req.user as any;
        return this.formsService.generateOtp(id, user.tenantId, user.id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('forms/:id/submissions')
    async getSubmissions(
        @Req() req: Request,
        @Param('id') id: string,
        @Query() query: any,
    ) {
        const user = req.user as any;
        return this.formsService.getSubmissions(id, user.tenantId, user.id, query);
    }

    @UseGuards(JwtAuthGuard)
    @Put('forms/submissions/:submissionId/status')
    async updateSubmissionStatus(
        @Req() req: Request,
        @Param('submissionId') submissionId: string,
        @Body() body: any,
    ) {
        const user = req.user as any;
        return this.formsService.updateSubmissionStatus(
            submissionId,
            user.tenantId,
            user.id,
            body,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Put('forms/submissions/:submissionId/link')
    async linkSubmission(
        @Req() req: Request,
        @Param('submissionId') submissionId: string,
        @Body() body: any,
    ) {
        const user = req.user as any;
        return this.formsService.linkSubmission(submissionId, user.tenantId, user.id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Post('forms/submissions/:submissionId/convert-client')
    async convertToClient(@Req() req: Request, @Param('submissionId') submissionId: string) {
        const user = req.user as any;
        return this.formsService.convertToClient(submissionId, user.tenantId, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('forms/submissions/:submissionId/convert-case')
    async convertToCase(
        @Req() req: Request,
        @Param('submissionId') submissionId: string,
        @Body() body: any,
    ) {
        const user = req.user as any;
        return this.formsService.convertToCase(submissionId, user.tenantId, user.id, body || {});
    }

    // ─── Per-answer visibility ───
    @UseGuards(JwtAuthGuard)
    @Put('forms/answers/:answerId/visibility')
    async setAnswerVisibility(
        @Req() req: Request,
        @Param('answerId') answerId: string,
        @Body() body: { userIds: string[] },
    ) {
        const user = req.user as any;
        return this.formsService.setAnswerVisibility(answerId, user.tenantId, user.id, body.userIds || []);
    }

    // ─── Answer notes ───
    @UseGuards(JwtAuthGuard)
    @Get('forms/answers/:answerId/notes')
    async listAnswerNotes(@Req() req: Request, @Param('answerId') answerId: string) {
        const user = req.user as any;
        return this.formsService.listAnswerNotes(answerId, user.tenantId, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('forms/answers/:answerId/notes')
    async addAnswerNote(
        @Req() req: Request,
        @Param('answerId') answerId: string,
        @Body() body: { content: string },
    ) {
        const user = req.user as any;
        return this.formsService.addAnswerNote(answerId, user.tenantId, user.id, body.content);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('forms/answers/:answerId/notes/:noteId')
    async deleteAnswerNote(
        @Req() req: Request,
        @Param('answerId') answerId: string,
        @Param('noteId') noteId: string,
    ) {
        const user = req.user as any;
        return this.formsService.deleteAnswerNote(answerId, noteId, user.tenantId, user.id);
    }

    // ─── Answer discussions ───
    @UseGuards(JwtAuthGuard)
    @Post('forms/answers/:answerId/discussion')
    async startDiscussion(
        @Req() req: Request,
        @Param('answerId') answerId: string,
        @Body() body: { inviteeIds?: string[]; message?: string },
    ) {
        const user = req.user as any;
        return this.formsService.startDiscussion(answerId, user.tenantId, user.id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('forms/discussions/:id')
    async getDiscussion(@Req() req: Request, @Param('id') id: string) {
        const user = req.user as any;
        return this.formsService.getDiscussion(id, user.tenantId, user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('forms/discussions/:id/messages')
    async addDiscussionMessage(
        @Req() req: Request,
        @Param('id') id: string,
        @Body() body: { content: string },
    ) {
        const user = req.user as any;
        return this.formsService.addDiscussionMessage(id, user.tenantId, user.id, body.content);
    }

    @UseGuards(JwtAuthGuard)
    @Post('forms/discussions/:id/invite')
    async inviteToDiscussion(
        @Req() req: Request,
        @Param('id') id: string,
        @Body() body: { userIds: string[] },
    ) {
        const user = req.user as any;
        return this.formsService.inviteToDiscussion(id, user.tenantId, user.id, body.userIds || []);
    }

    // ══════════════════════════════════════════════════════════
    // PUBLIC ENDPOINTS (no auth required)
    // ══════════════════════════════════════════════════════════

    @Get('public/forms/:slug')
    async getPublicForm(@Param('slug') slug: string) {
        return this.formsService.findBySlug(slug);
    }

    @Post('public/forms/:slug/verify-otp')
    async verifyOtp(@Param('slug') slug: string, @Body() body: { code: string }) {
        return this.formsService.verifyOtp(slug, body.code);
    }

    @Post('public/forms/:slug/submit')
    async submitPublicForm(
        @Param('slug') slug: string,
        @Body() body: any,
        @Req() req: Request,
    ) {
        const metadata = {
            ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
        };
        return this.formsService.submitForm(slug, body, metadata);
    }
}
