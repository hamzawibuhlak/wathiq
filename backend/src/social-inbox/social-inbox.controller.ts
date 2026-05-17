import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SocialInboxService } from './social-inbox.service';
import { SocialPlatform } from '@prisma/client';

@ApiTags('Social Inbox')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('social-inbox')
export class SocialInboxController {
  constructor(private readonly socialInboxService: SocialInboxService) {}

  @Get('conversations')
  getConversations(
    @CurrentUser() user: any,
    @Query('platform') platform?: SocialPlatform,
  ) {
    return this.socialInboxService.getConversations(user.id, user.role, platform);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string) {
    return this.socialInboxService.getMessages(id);
  }

  @Post('conversations/:id/assign')
  assignConversation(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
  ) {
    return this.socialInboxService.assignConversation(id, assigneeId);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.socialInboxService.sendMessage(id, user.id, content);
  }
}
