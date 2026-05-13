import { Module } from '@nestjs/common';
import { SocialInboxController } from './social-inbox.controller';
import { SocialInboxService } from './social-inbox.service';

@Module({
  controllers: [SocialInboxController],
  providers: [SocialInboxService]
})
export class SocialInboxModule {}
