import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketingService } from './marketing.service';

@Controller('marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {
    constructor(private marketingService: MarketingService) { }

    // ═══ LEADS ═══

    @Get('leads')
    async getLeads(@Req() req: any, @Query() query: any) {
        return this.marketingService.getLeads(query);
    }

    @Get('leads/kanban')
    async getLeadsKanban(@Req() req: any) {
        return this.marketingService.getLeadsKanban();
    }

    @Get('leads/stats')
    async getLeadStats(@Req() req: any) {
        return this.marketingService.getLeadStats();
    }

    @Post('leads')
    async createLead(@Req() req: any, @Body() body: any) {
        return this.marketingService.createLead(req.user.id, body);
    }

    @Get('leads/:id')
    async getLeadById(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.getLeadById(id);
    }

    @Put('leads/:id')
    async updateLead(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.updateLead(id, body);
    }

    @Delete('leads/:id')
    async deleteLead(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.deleteLead(id);
    }

    @Patch('leads/:id/status')
    async updateLeadStatus(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.updateLeadStatus(id, req.user.id, body.status, body.notes);
    }

    @Post('leads/:id/activities')
    async logLeadActivity(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.logLeadActivity(id, req.user.id, body);
    }

    // ═══ AFFILIATES ═══

    @Get('affiliates')
    async getAffiliates(@Req() req: any) {
        return this.marketingService.getAffiliates();
    }

    @Post('affiliates')
    async createAffiliate(@Req() req: any, @Body() body: any) {
        return this.marketingService.createAffiliate(body);
    }

    @Put('affiliates/:id')
    async updateAffiliate(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.updateAffiliate(id, body);
    }

    @Get('affiliates/:id/commissions')
    async getAffiliateCommissions(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.getAffiliateCommissions(id);
    }

    @Get('affiliates/stats')
    async getAffiliateStats(@Req() req: any) {
        return this.marketingService.getAffiliateStats();
    }

    @Get('commissions')
    async getAllCommissions(@Req() req: any, @Query('status') status?: string) {
        return this.marketingService.getAllCommissions(status);
    }

    @Patch('commissions/:id/approve')
    async approveCommission(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.approveCommission(id);
    }

    @Patch('commissions/:id/pay')
    async payCommission(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.payCommission(id);
    }

    // ═══ CAMPAIGNS ═══

    @Get('campaigns')
    async getCampaigns(@Req() req: any, @Query() query: any) {
        return this.marketingService.getCampaigns(query);
    }

    @Post('campaigns')
    async createCampaign(@Req() req: any, @Body() body: any) {
        return this.marketingService.createCampaign(req.user.id, body);
    }

    @Get('campaigns/:id')
    async getCampaignById(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.getCampaignById(id);
    }

    @Put('campaigns/:id')
    async updateCampaign(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.updateCampaign(id, body);
    }

    // ═══ ADS ANALYTICS ═══

    @Get('ads/connections')
    async getAdsConnections(@Req() req: any) {
        return this.marketingService.getAdsConnections();
    }

    @Post('ads/connect')
    async connectAdsPlatform(@Req() req: any, @Body() body: any) {
        return this.marketingService.connectAdsPlatform(body);
    }

    @Get('ads/dashboard')
    async getAdsDashboard(@Req() req: any, @Query('from') from: string, @Query('to') to: string) {
        return this.marketingService.getAdsDashboard(

            from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to ? new Date(to) : new Date(),
        );
    }

    // ═══ TELEMARKETING ═══

    @Get('telemarketing/queue')
    async getCallQueue(@Req() req: any) {
        return this.marketingService.getCallQueue();
    }

    @Post('telemarketing/calls')
    async logCall(@Req() req: any, @Body() body: any) {
        return this.marketingService.logCall(req.user.id, body);
    }

    @Get('telemarketing/scripts')
    async getCallScripts(@Req() req: any) {
        return this.marketingService.getCallScripts();
    }

    @Post('telemarketing/scripts')
    async createCallScript(@Req() req: any, @Body() body: any) {
        return this.marketingService.createCallScript(body);
    }

    @Get('telemarketing/stats')
    async getCallStats(@Req() req: any) {
        return this.marketingService.getCallStats();
    }

    // ═══ MESSAGE CAMPAIGNS ═══

    @Get('messages')
    async getMessageCampaigns(@Req() req: any, @Query('type') type?: string) {
        return this.marketingService.getMessageCampaigns(type);
    }

    @Post('messages')
    async createMessageCampaign(@Req() req: any, @Body() body: any) {
        return this.marketingService.createMessageCampaign(req.user.id, body);
    }

    @Get('messages/:id')
    async getMessageCampaignById(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.getMessageCampaignById(id);
    }

    // ═══ CONTENT CALENDAR ═══

    @Get('calendar')
    async getContentCalendar(@Req() req: any, @Query('month') month: string, @Query('year') year: string) {
        return this.marketingService.getContentCalendar(

            parseInt(month) || new Date().getMonth() + 1,
            parseInt(year) || new Date().getFullYear(),
        );
    }

    @Post('calendar')
    async createContentItem(@Req() req: any, @Body() body: any) {
        return this.marketingService.createContentItem(body);
    }

    @Put('calendar/:id')
    async updateContentItem(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.marketingService.updateContentItem(id, body);
    }

    @Delete('calendar/:id')
    async deleteContentItem(@Req() req: any, @Param('id') id: string) {
        return this.marketingService.deleteContentItem(id);
    }
}
