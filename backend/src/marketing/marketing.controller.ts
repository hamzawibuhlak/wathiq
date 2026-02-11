import {
    Controller, Get, Post, Put, Delete, Patch,
    Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketingService } from './marketing.service';

@Controller('api/marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {
    constructor(private marketingService: MarketingService) { }

    // ═══ LEADS ═══

    @Get('leads')
    async getLeads(@Req() req: any, @Query() query: any) {
        return this.marketingService.getLeads(req.user.tenantId, query);
    }

    @Get('leads/kanban')
    async getLeadsKanban(@Req() req: any) {
        return this.marketingService.getLeadsKanban(req.user.tenantId);
    }

    @Get('leads/stats')
    async getLeadStats(@Req() req: any) {
        return this.marketingService.getLeadStats(req.user.tenantId);
    }

    @Post('leads')
    async createLead(@Req() req: any, @Body() body: any) {
        return this.marketingService.createLead(req.user.tenantId, req.user.id, body);
    }

    @Get('leads/:id')
    async getLeadById(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.getLeadById(id, req.user.tenantId);
    }

    @Put('leads/:id')
    async updateLead(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.updateLead(id, req.user.tenantId, body);
    }

    @Delete('leads/:id')
    async deleteLead(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.deleteLead(id, req.user.tenantId);
    }

    @Patch('leads/:id/status')
    async updateLeadStatus(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.updateLeadStatus(id, req.user.tenantId, req.user.id, body.status, body.notes);
    }

    @Post('leads/:id/activities')
    async logLeadActivity(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.logLeadActivity(id, req.user.tenantId, req.user.id, body);
    }

    // ═══ AFFILIATES ═══

    @Get('affiliates')
    async getAffiliates(@Req() req: any) {
        return this.marketingService.getAffiliates(req.user.tenantId);
    }

    @Post('affiliates')
    async createAffiliate(@Req() req: any, @Body() body: any) {
        return this.marketingService.createAffiliate(req.user.tenantId, body);
    }

    @Put('affiliates/:id')
    async updateAffiliate(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.updateAffiliate(id, req.user.tenantId, body);
    }

    @Get('affiliates/:id/commissions')
    async getAffiliateCommissions(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.getAffiliateCommissions(id, req.user.tenantId);
    }

    @Get('affiliates/stats')
    async getAffiliateStats(@Req() req: any) {
        return this.marketingService.getAffiliateStats(req.user.tenantId);
    }

    @Get('commissions')
    async getAllCommissions(@Req() req: any, @Query('status') status?: string) {
        return this.marketingService.getAllCommissions(req.user.tenantId, status);
    }

    @Patch('commissions/:id/approve')
    async approveCommission(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.approveCommission(id, req.user.tenantId);
    }

    @Patch('commissions/:id/pay')
    async payCommission(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.payCommission(id, req.user.tenantId);
    }

    // ═══ CAMPAIGNS ═══

    @Get('campaigns')
    async getCampaigns(@Req() req: any, @Query() query: any) {
        return this.marketingService.getCampaigns(req.user.tenantId, query);
    }

    @Post('campaigns')
    async createCampaign(@Req() req: any, @Body() body: any) {
        return this.marketingService.createCampaign(req.user.tenantId, req.user.id, body);
    }

    @Get('campaigns/:id')
    async getCampaignById(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.getCampaignById(id, req.user.tenantId);
    }

    @Put('campaigns/:id')
    async updateCampaign(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.updateCampaign(id, req.user.tenantId, body);
    }

    // ═══ ADS ANALYTICS ═══

    @Get('ads/connections')
    async getAdsConnections(@Req() req: any) {
        return this.marketingService.getAdsConnections(req.user.tenantId);
    }

    @Post('ads/connect')
    async connectAdsPlatform(@Req() req: any, @Body() body: any) {
        return this.marketingService.connectAdsPlatform(req.user.tenantId, body);
    }

    @Get('ads/dashboard')
    async getAdsDashboard(@Req() req: any, @Query('from') from: string, @Query('to') to: string) {
        return this.marketingService.getAdsDashboard(
            req.user.tenantId,
            from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to ? new Date(to) : new Date(),
        );
    }

    // ═══ TELEMARKETING ═══

    @Get('telemarketing/queue')
    async getCallQueue(@Req() req: any) {
        return this.marketingService.getCallQueue(req.user.tenantId);
    }

    @Post('telemarketing/calls')
    async logCall(@Req() req: any, @Body() body: any) {
        return this.marketingService.logCall(req.user.tenantId, req.user.id, body);
    }

    @Get('telemarketing/scripts')
    async getCallScripts(@Req() req: any) {
        return this.marketingService.getCallScripts(req.user.tenantId);
    }

    @Post('telemarketing/scripts')
    async createCallScript(@Req() req: any, @Body() body: any) {
        return this.marketingService.createCallScript(req.user.tenantId, body);
    }

    @Get('telemarketing/stats')
    async getCallStats(@Req() req: any) {
        return this.marketingService.getCallStats(req.user.tenantId);
    }

    // ═══ MESSAGE CAMPAIGNS ═══

    @Get('messages')
    async getMessageCampaigns(@Req() req: any, @Query('type') type?: string) {
        return this.marketingService.getMessageCampaigns(req.user.tenantId, type);
    }

    @Post('messages')
    async createMessageCampaign(@Req() req: any, @Body() body: any) {
        return this.marketingService.createMessageCampaign(req.user.tenantId, req.user.id, body);
    }

    @Get('messages/:id')
    async getMessageCampaignById(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.getMessageCampaignById(id, req.user.tenantId);
    }

    // ═══ CONTENT CALENDAR ═══

    @Get('calendar')
    async getContentCalendar(@Req() req: any, @Query('month') month: string, @Query('year') year: string) {
        return this.marketingService.getContentCalendar(
            req.user.tenantId,
            parseInt(month) || new Date().getMonth() + 1,
            parseInt(year) || new Date().getFullYear(),
        );
    }

    @Post('calendar')
    async createContentItem(@Req() req: any, @Body() body: any) {
        return this.marketingService.createContentItem(req.user.tenantId, body);
    }

    @Put('calendar/:id')
    async updateContentItem(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.updateContentItem(id, req.user.tenantId, body);
    }

    @Delete('calendar/:id')
    async deleteContentItem(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.deleteContentItem(id, req.user.tenantId);
    }
}
