import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SocialInboxService } from './social-inbox.service';
import { SocialPlatform } from '@prisma/client';

// Note: Ensure Auth settings match project standard guards. Using mock ANY for brevity.
// Assuming your users are authenticated and have req.user = { id, tenantId, role }
import { AuthGuard } from '@nestjs/passport'; // Example, will adjust to your project's Auth strategy if necessary

@Controller('social-inbox')
export class SocialInboxController {
  constructor(private readonly socialInboxService: SocialInboxService) {}

  @Get('conversations')
  //@UseGuards(AuthGuard('jwt'))
  getConversations(
    @Req() req: any,
    @Query('platform') platform?: SocialPlatform
  ) {
    // Dummy user context if guard isn't enforcing yet - please ensure to integrate global auth later
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    const userId = req.user?.id || req.headers['x-user-id'];
    const role = req.user?.role || req.headers['x-user-role'] || 'ADMIN'; 
    return this.socialInboxService.getConversations(tenantId, userId, role, platform);
  }

  @Get('conversations/:id/messages')
  //@UseGuards(AuthGuard('jwt'))
  getMessages(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.socialInboxService.getMessages(tenantId, id);
  }

  @Post('conversations/:id/assign')
  //@UseGuards(AuthGuard('jwt'))
  assignConversation(
    @Req() req: any,
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string
  ) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.socialInboxService.assignConversation(tenantId, id, assigneeId);
  }

  @Post('conversations/:id/messages')
  //@UseGuards(AuthGuard('jwt'))
  sendMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body('content') content: string
  ) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.socialInboxService.sendMessage(tenantId, id, userId, content);
  }
}
