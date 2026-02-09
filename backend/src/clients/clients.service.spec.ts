import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    client: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const tenantId = 'tenant-1';
  const userId = 'user-1';

  const mockClient = {
    id: 'client-1',
    name: 'عميل اختبار',
    email: 'client@example.com',
    phone: '0501234567',
    nationalId: '1234567890',
    companyName: null,
    city: 'الرياض',
    address: 'شارع الملك فهد',
    isActive: true,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { cases: 5 },
    visibleToUsers: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========== FIND ALL TESTS ==========
  describe('findAll', () => {
    it('should return paginated clients', async () => {
      const mockClients = [mockClient];
      mockPrismaService.client.findMany.mockResolvedValue(mockClients);
      mockPrismaService.client.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, { page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toEqual(mockClients);
      expect(result.meta.total).toBe(1);
    });

    it('should search by name, phone, email', async () => {
      mockPrismaService.client.findMany.mockResolvedValue([]);
      mockPrismaService.client.count.mockResolvedValue(0);

      await service.findAll(tenantId, { search: 'أحمد' });

      expect(mockPrismaService.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            OR: expect.arrayContaining([
              { name: { contains: 'أحمد', mode: 'insensitive' } },
              { phone: { contains: 'أحمد', mode: 'insensitive' } },
              { email: { contains: 'أحمد', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should filter by isActive', async () => {
      mockPrismaService.client.findMany.mockResolvedValue([]);
      mockPrismaService.client.count.mockResolvedValue(0);

      await service.findAll(tenantId, { isActive: true });

      expect(mockPrismaService.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            isActive: true,
          }),
        })
      );
    });

    it('should filter by city', async () => {
      mockPrismaService.client.findMany.mockResolvedValue([]);
      mockPrismaService.client.count.mockResolvedValue(0);

      await service.findAll(tenantId, { city: 'الرياض' });

      expect(mockPrismaService.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            city: { contains: 'الرياض', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should restrict LAWYER to visible clients', async () => {
      mockPrismaService.client.findMany.mockResolvedValue([]);
      mockPrismaService.client.count.mockResolvedValue(0);

      await service.findAll(tenantId, {}, userId, 'LAWYER');

      expect(mockPrismaService.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            visibleToUsers: {
              some: { id: userId },
            },
          }),
        })
      );
    });

    it('should paginate correctly', async () => {
      mockPrismaService.client.findMany.mockResolvedValue([]);
      mockPrismaService.client.count.mockResolvedValue(50);

      const result = await service.findAll(tenantId, { page: 2, limit: 10 });

      expect(mockPrismaService.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (2-1) * 10
          take: 10,
        })
      );
      expect(result.meta.totalPages).toBe(5);
    });
  });

  // ========== FIND ONE TESTS ==========
  describe('findOne', () => {
    it('should return client by id', async () => {
      const clientWithRelations = {
        ...mockClient,
        cases: [],
        invoices: [],
      };
      mockPrismaService.client.findFirst.mockResolvedValue(clientWithRelations);

      const result = await service.findOne('client-1', tenantId);

      expect(result).toHaveProperty('data');
      expect(result.data.id).toBe('client-1');
    });

    it('should throw NotFoundException for non-existent client', async () => {
      mockPrismaService.client.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', tenantId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent', tenantId)).rejects.toThrow('العميل غير موجود');
    });
  });

  // ========== CREATE TESTS ==========
  describe('create', () => {
    const createDto = {
      name: 'عميل جديد',
      phone: '0509876543',
      email: 'new@example.com',
    };

    it('should create client successfully', async () => {
      mockPrismaService.client.create.mockResolvedValue({
        ...mockClient,
        ...createDto,
        id: 'client-new',
      });

      const result = await service.create(createDto as any, tenantId);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('message', 'تم إنشاء العميل بنجاح');
      expect(mockPrismaService.client.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createDto,
          tenantId,
        }),
      });
    });
  });

  // ========== UPDATE TESTS ==========
  describe('update', () => {
    const updateDto = {
      name: 'اسم محدث',
      phone: '0551234567',
    };

    it('should update client', async () => {
      mockPrismaService.client.findFirst.mockResolvedValue(mockClient);
      mockPrismaService.client.update.mockResolvedValue({ ...mockClient, ...updateDto });

      const result = await service.update('client-1', updateDto as any, tenantId);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('message', 'تم تحديث بيانات العميل بنجاح');
    });

    it('should throw NotFoundException for non-existent client', async () => {
      mockPrismaService.client.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent', updateDto as any, tenantId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========== DELETE TESTS ==========
  describe('remove', () => {
    it('should delete client', async () => {
      mockPrismaService.client.findFirst.mockResolvedValue(mockClient);
      mockPrismaService.client.delete.mockResolvedValue(mockClient);

      const result = await service.remove('client-1', tenantId);

      expect(result).toEqual({ message: 'تم حذف العميل بنجاح' });
    });

    it('should throw NotFoundException for non-existent client', async () => {
      mockPrismaService.client.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent', tenantId)).rejects.toThrow(NotFoundException);
    });
  });
});
