import { Test, TestingModule } from '@nestjs/testing';
import { SocialInboxService } from './social-inbox.service';

describe('SocialInboxService', () => {
  let service: SocialInboxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocialInboxService],
    }).compile();

    service = module.get<SocialInboxService>(SocialInboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
