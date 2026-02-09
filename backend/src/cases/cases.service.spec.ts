import { Test, TestingModule } from '@nestjs/testing';
import { CasesService } from './cases.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CaseStatus, CaseType, CasePriority, UserRole } from '@prisma/client';

describe('CasesService', () => {
  let service: CasesService;
  let prisma: PrismaService;
  let notificationsService: NotificationsService;

  const mockPrismaService = {
    case: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  const tenantId = 'tenant-1';
  const userId = 'user-1';

  const mockCase = {
    id: 'case-1',
    caseNumber: '2024/001',
    title: 'قضية اختبار',
    description: 'وصف القضية',
    caseType: CaseType.CIVIL,
    status: CaseStatus.OPEN,
    priority: CasePriority.MEDIUM,
    tenantId,
    clientId: 'client-1',
    assignedToId: userId,
    createdById: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    client: { id: 'client-1', name: 'عميل اختبار', phone: '0501234567' },
    assignedTo: { id: userId, name: 'محامي اختبار', avatar: null },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<CasesService>(CasesService);
    prisma = module.get<PrismaService>(PrismaService);
    notificationsService = module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========== FIND ALL TESTS ==========
  describe('findAll', () => {
    it('should return paginated cases', async () => {
      const mockCases = [mockCase];
      mockPrismaService.case.findMany.mockResolvedValue(mockCases);
      mockPrismaService.case.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, { page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toEqual(mockCases);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrismaService.case.findMany.mockResolvedValue([]);
      mockPrismaService.case.count.mockResolvedValue(0);

      await service.findAll(tenantId, { status: CaseStatus.OPEN });

      expect(mockPrismaService.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            status: CaseStatus.OPEN,
          }),
        })
      );
    });

    it('should filter by caseType', async () => {
      mockPrismaService.case.findMany.mockResolvedValue([]);
      mockPrismaService.case.count.mockResolvedValue(0);

      await service.findAll(tenantId, { caseType: CaseType.CRIMINAL });

      expect(mockPrismaService.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            caseType: CaseType.CRIMINAL,
          }),
        })
      );
    });

    it('should search by title, description, or caseNumber', async () => {
      mockPrismaService.case.findMany.mockResolvedValue([]);
      mockPrismaService.case.count.mockResolvedValue(0);

      await service.findAll(tenantId, { search: 'بحث' });

      expect(mockPrismaService.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            OR: expect.arrayContaining([
              { title: { contains: 'بحث', mode: 'insensitive' } },
              { description: { contains: 'بحث', mode: 'insensitive' } },
              { caseNumber: { contains: 'بحث', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should restrict LAWYER to their own cases', async () => {
      mockPrismaService.case.findMany.mockResolvedValue([]);
      mockPrismaService.case.count.mockResolvedValue(0);

      await service.findAll(tenantId, {}, userId, UserRole.LAWYER);

      expect(mockPrismaService.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            assignedToId: userId,
          }),
        })
      );
    });

    it('should allow ADMIN to see all cases', async () => {
      mockPrismaService.case.findMany.mockResolvedValue([]);
      mockPrismaService.case.count.mockResolvedValue(0);

      await service.findAll(tenantId, {}, userId, UserRole.ADMIN);

      expect(mockPrismaService.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
          }),
        })
      );
      // assignedToId should NOT be in where for ADMIN
      const call = mockPrismaService.case.findMany.mock.calls[0][0];
      expect(call.where.assignedToId).toBeUndefined();
    });

    it('should paginate correctly', async () => {
      mockPrismaService.case.findMany.mockResolvedValue([]);
      mockPrismaService.case.count.mockResolvedValue(100);

      const result = await service.findAll(tenantId, { page: 3, limit: 20 });

      expect(mockPrismaService.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (3-1) * 20
          take: 20,
        })
      );
      expect(result.meta.totalPages).toBe(5); // 100 / 20
    });
  });

  // ========== FIND ONE TESTS ==========
  describe('findOne', () => {
    it('should return case by id', async () => {
      const caseWithRelations = {
        ...mockCase,
        hearings: [],
        documents: [],
        invoices: [],
        createdBy: { id: userId, name: 'Creator' },
      };
      mockPrismaService.case.findFirst.mockResolvedValue(caseWithRelations);

      const result = await service.findOne('case-1', tenantId);

      expect(result).toHaveProperty('data');
      expect(result.data.id).toBe('case-1');
    });

    it('should throw NotFoundException for non-existent case', async () => {
      mockPrismaService.case.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', tenantId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent', tenantId)).rejects.toThrow('القضية غير موجودة');
    });

    it('should throw ForbiddenException for LAWYER accessing other\'s case', async () => {
      const otherUserCase = { ...mockCase, assignedToId: 'other-user' };
      mockPrismaService.case.findFirst.mockResolvedValue(otherUserCase);

      await expect(
        service.findOne('case-1', tenantId, userId, UserRole.LAWYER)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findOne('case-1', tenantId, userId, UserRole.LAWYER)
      ).rejects.toThrow('لا تملك صلاحية الوصول لهذه القضية');
    });

    it('should allow LAWYER to access their own case', async () => {
      const caseWithRelations = {
        ...mockCase,
        hearings: [],
        documents: [],
        invoices: [],
        createdBy: { id: userId, name: 'Creator' },
      };
      mockPrismaService.case.findFirst.mockResolvedValue(caseWithRelations);

      const result = await service.findOne('case-1', tenantId, userId, UserRole.LAWYER);

      expect(result.data.id).toBe('case-1');
    });
  });

  // ========== CREATE TESTS ==========
  describe('create', () => {
    const createDto = {
      title: 'قضية جديدة',
      caseType: CaseType.CIVIL,
      clientId: 'client-1',
      priority: CasePriority.HIGH,
    };

    it('should create case with auto-generated number', async () => {
      // Mock for generateCaseNumber
      mockPrismaService.$queryRaw.mockResolvedValue([{ count: BigInt(5) }]);
      mockPrismaService.case.create.mockResolvedValue({
        ...mockCase,
        ...createDto,
        caseNumber: '2024/006',
      });

      const result = await service.create(createDto as any, tenantId, userId);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('message', 'تم إنشاء القضية بنجاح');
      expect(mockPrismaService.case.create).toHaveBeenCalled();
    });

    it('should send notification when assigned to different user', async () => {
      const dtoWithAssignee = {
        ...createDto,
        assignedToId: 'other-lawyer',
      };

      mockPrismaService.$queryRaw.mockResolvedValue([{ count: BigInt(5) }]);
      mockPrismaService.case.create.mockResolvedValue({
        ...mockCase,
        ...dtoWithAssignee,
        caseNumber: '2024/006',
      });

      await service.create(dtoWithAssignee as any, tenantId, userId);

      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'other-lawyer',
          tenantId,
          type: 'INFO',
        })
      );
    });

    it('should NOT send notification when assigned to self', async () => {
      const dtoWithSelf = {
        ...createDto,
        assignedToId: userId,
      };

      mockPrismaService.$queryRaw.mockResolvedValue([{ count: BigInt(5) }]);
      mockPrismaService.case.create.mockResolvedValue({
        ...mockCase,
        ...dtoWithSelf,
        caseNumber: '2024/006',
      });

      await service.create(dtoWithSelf as any, tenantId, userId);

      expect(mockNotificationsService.create).not.toHaveBeenCalled();
    });
  });

  // ========== UPDATE TESTS ==========
  describe('update', () => {
    const updateDto = {
      title: 'عنوان محدث',
      status: CaseStatus.IN_PROGRESS,
    };

    it('should update case', async () => {
      mockPrismaService.case.findFirst.mockResolvedValue(mockCase);
      mockPrismaService.case.update.mockResolvedValue({ ...mockCase, ...updateDto });

      const result = await service.update('case-1', updateDto as any, tenantId);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('message', 'تم تحديث القضية بنجاح');
      expect(mockPrismaService.case.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: updateDto,
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException for non-existent case', async () => {
      mockPrismaService.case.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent', updateDto as any, tenantId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for LAWYER updating other\'s case', async () => {
      const otherUserCase = { ...mockCase, assignedToId: 'other-user' };
      mockPrismaService.case.findFirst.mockResolvedValue(otherUserCase);

      await expect(
        service.update('case-1', updateDto as any, tenantId, userId, UserRole.LAWYER)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow LAWYER to update their own case', async () => {
      mockPrismaService.case.findFirst.mockResolvedValue(mockCase);
      mockPrismaService.case.update.mockResolvedValue({ ...mockCase, ...updateDto });

      const result = await service.update('case-1', updateDto as any, tenantId, userId, UserRole.LAWYER);

      expect(result.message).toBe('تم تحديث القضية بنجاح');
    });
  });

  // ========== DELETE TESTS ==========
  describe('remove', () => {
    it('should delete case', async () => {
      mockPrismaService.case.findFirst.mockResolvedValue(mockCase);
      mockPrismaService.case.delete.mockResolvedValue(mockCase);

      const result = await service.remove('case-1', tenantId);

      expect(result).toEqual({ message: 'تم حذف القضية بنجاح' });
      expect(mockPrismaService.case.delete).toHaveBeenCalledWith({
        where: { id: 'case-1' },
      });
    });

    it('should throw NotFoundException for non-existent case', async () => {
      mockPrismaService.case.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent', tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  // ========== STATS TESTS ==========
  describe('getStats', () => {
    it('should return case statistics', async () => {
      mockPrismaService.case.count.mockResolvedValue(50);
      mockPrismaService.case.groupBy.mockResolvedValue([
        { status: 'OPEN', _count: { _all: 20 } },
        { status: 'CLOSED', _count: { _all: 30 } },
      ]);

      const result = await service.getStats(tenantId);

      expect(result).toHaveProperty('data');
      expect(mockPrismaService.case.count).toHaveBeenCalled();
    });

    it('should restrict LAWYER to their own case stats', async () => {
      mockPrismaService.case.count.mockResolvedValue(10);
      mockPrismaService.case.groupBy.mockResolvedValue([]);

      await service.getStats(tenantId, userId, UserRole.LAWYER);

      expect(mockPrismaService.case.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            assignedToId: userId,
          }),
        })
      );
    });
  });
});
