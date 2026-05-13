import { Test, TestingModule } from '@nestjs/testing';
import { SocialInboxController } from './social-inbox.controller';

describe('SocialInboxController', () => {
  let controller: SocialInboxController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialInboxController],
    }).compile();

    controller = module.get<SocialInboxController>(SocialInboxController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
