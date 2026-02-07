import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserInvitationsService } from './user-invitations.service';
import { SessionsService } from './sessions.service';
import { InvitationsController } from './invitations.controller';
import { SessionsController } from './sessions.controller';

@Module({
    controllers: [
        UsersController,
        InvitationsController,
        SessionsController,
    ],
    providers: [
        UsersService,
        UserInvitationsService,
        SessionsService,
    ],
    exports: [
        UsersService,
        UserInvitationsService,
        SessionsService,
    ],
})
export class UsersModule {}
