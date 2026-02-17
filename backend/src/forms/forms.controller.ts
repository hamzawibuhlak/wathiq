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
        return this.formsService.findAll(user.tenantId, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('forms/:id')
    async findById(@Req() req: Request, @Param('id') id: string) {
        const user = req.user as any;
        return this.formsService.findById(id, user.tenantId);
    }

    @UseGuards(JwtAuthGuard)
    @Put('forms/:id')
    async update(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
        const user = req.user as any;
        return this.formsService.update(id, user.tenantId, body);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('forms/:id')
    async delete(@Req() req: Request, @Param('id') id: string) {
        const user = req.user as any;
        return this.formsService.delete(id, user.tenantId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('forms/:id/submissions')
    async getSubmissions(
        @Req() req: Request,
        @Param('id') id: string,
        @Query() query: any,
    ) {
        const user = req.user as any;
        return this.formsService.getSubmissions(id, user.tenantId, query);
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

    // ══════════════════════════════════════════════════════════
    // PUBLIC ENDPOINTS (no auth required)
    // ══════════════════════════════════════════════════════════

    @Get('public/forms/:slug')
    async getPublicForm(@Param('slug') slug: string) {
        return this.formsService.findBySlug(slug);
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
