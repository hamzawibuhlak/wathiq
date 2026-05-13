import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },

    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockEmailService = {
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
    sendOtpEmail: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========== LOGIN TESTS ==========
  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      password: '', // Will be set in each test
      name: 'Test User',
      phone: '0501234567',
      role: UserRole.LAWYER,

      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),

    };

    it('should return access token for valid credentials', async () => {
      // Hash password
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const userWithPassword = { ...mockUser, password: hashedPassword };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithPassword);
      mockPrismaService.user.update.mockResolvedValue(userWithPassword);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const inactiveUser = { ...mockUser, password: hashedPassword, isActive: false };

      mockPrismaService.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('الحساب معطل');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('different-password', 10);
      const userWithDifferentPassword = { ...mockUser, password: hashedPassword };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithDifferentPassword);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('should update lastLoginAt on successful login', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const userWithPassword = { ...mockUser, password: hashedPassword };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithPassword);
      mockPrismaService.user.update.mockResolvedValue(userWithPassword);

      await service.login(loginDto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });
  });

  // ========== GET ME TESTS ==========
  describe('getMe', () => {
    const userId = 'user-1';

    const mockUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      phone: '0501234567',
      role: UserRole.LAWYER,
      avatar: null,
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),

    };

    it('should return user data', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe(userId);

      expect(result).toHaveProperty('data');
      expect(result.data).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
        }),
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe(userId)).rejects.toThrow(NotFoundException);
      await expect(service.getMe(userId)).rejects.toThrow('المستخدم غير موجود');
    });
  });

  // ========== LOGOUT TESTS ==========
  describe('logout', () => {
    const userId = 'user-1';

    it('should return success message', async () => {
      mockPrismaService.user.update.mockResolvedValue({ id: userId });

      const result = await service.logout(userId);

      expect(result).toEqual({ message: 'تم تسجيل الخروج بنجاح' });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { updatedAt: expect.any(Date) },
      });
    });
  });

  // ========== VALIDATE USER TESTS ==========
  describe('validateUser', () => {
    const userId = 'user-1';

    const mockUser = {
      id: userId,
      email: 'test@example.com',
      password: 'hashed-password',
      name: 'Test User',
      role: UserRole.LAWYER,
      isActive: true,

    };

    it('should return user without password for valid user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(userId);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('email', mockUser.email);
    });

    it('should return null for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });

  });

  // ========== PASSWORD UTILITY TESTS ==========
  describe('password utilities', () => {
    it('should hash password', async () => {
      const password = 'TestPassword123!';
      const hash = await service.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should compare password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await service.comparePassword(password, hash);
      const isInvalid = await service.comparePassword('wrong-password', hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });
});
