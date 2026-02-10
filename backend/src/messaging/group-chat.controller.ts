import { Controller, Post, Get, Patch, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GroupChatService } from './group-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Group Chats')
@ApiBearerAuth()
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupChatController {
    constructor(private groupChatService: GroupChatService) { }

    @Post()
    @ApiOperation({ summary: 'Create new group chat' })
    async createGroup(
        @CurrentUser() user: User,
        @Body() body: { name: string; description?: string; memberIds: string[] },
    ) {
        return this.groupChatService.createGroup(user.tenantId, user.id, body);
    }

    @Get()
    @ApiOperation({ summary: 'Get user groups' })
    async getUserGroups(@CurrentUser() user: User) {
        return this.groupChatService.getUserGroups(user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get group details' })
    async getGroup(@CurrentUser() user: User, @Param('id') id: string) {
        return this.groupChatService.getGroup(id, user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update group info' })
    async updateGroup(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string; avatar?: string },
    ) {
        return this.groupChatService.updateGroup(id, user.id, body);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete group' })
    async deleteGroup(@CurrentUser() user: User, @Param('id') id: string) {
        return this.groupChatService.deleteGroup(id, user.id);
    }

    @Post(':id/members')
    @ApiOperation({ summary: 'Add members to group' })
    async addMembers(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() body: { memberIds: string[] },
    ) {
        return this.groupChatService.addMembers(id, user.id, body.memberIds);
    }

    @Delete(':id/members/:memberId')
    @ApiOperation({ summary: 'Remove member from group' })
    async removeMember(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Param('memberId') memberId: string,
    ) {
        return this.groupChatService.removeMember(id, user.id, memberId);
    }

    @Get(':id/messages')
    @ApiOperation({ summary: 'Get group messages' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'before', required: false, description: 'Message ID for pagination' })
    async getMessages(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Query('limit') limit?: string,
        @Query('before') before?: string,
    ) {
        return this.groupChatService.getGroupMessages(
            id,
            user.id,
            limit ? parseInt(limit) : 50,
            before,
        );
    }

    @Post(':id/messages')
    @ApiOperation({ summary: 'Send message to group' })
    async sendMessage(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() body: { content: string; attachments?: string[] },
    ) {
        return this.groupChatService.sendGroupMessage(
            user.id,
            id,
            body.content,
            body.attachments,
        );
    }
}
