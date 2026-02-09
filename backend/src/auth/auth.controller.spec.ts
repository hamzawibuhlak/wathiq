import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ========== REGISTER TESTS ==========
  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      officeName: 'Test Firm',
      phone: '0501234567',
    };

    const mockResponse = {
      accessToken: 'mock-token',
      user: {
        id: 'user-1',
        email: registerDto.email,
        name: registerDto.name,
        role: UserRole.OWNER,
      },
      message: 'تم إنشاء الحساب بنجاح',
    };

    it('should register new user and return token', async () => {
      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should pass dto to service correctly', async () => {
      mockAuthService.register.mockResolvedValue(mockResponse);

      await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });
  });

  // ========== LOGIN TESTS ==========
  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockResponse = {
      accessToken: 'mock-token',
      user: {
        id: 'user-1',
        email: loginDto.email,
        name: 'Test User',
        role: UserRole.LAWYER,
      },
    };

    it('should login and return token', async () => {
      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should pass dto to service correctly', async () => {
      mockAuthService.login.mockResolvedValue(mockResponse);

      await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  // ========== GET ME TESTS ==========
  describe('getMe', () => {
    const userId = 'user-1';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.LAWYER,
      tenant: {
        id: 'tenant-1',
        name: 'Test Firm',
      },
    };

    it('should return current user data', async () => {
      mockAuthService.getMe.mockResolvedValue({ data: mockUser });

      const result = await controller.getMe(userId);

      expect(result).toEqual({ data: mockUser });
      expect(mockAuthService.getMe).toHaveBeenCalledWith(userId);
    });
  });

  // ========== LOGOUT TESTS ==========
  describe('logout', () => {
    const userId = 'user-1';

    it('should logout successfully', async () => {
      const mockResponse = { message: 'تم تسجيل الخروج بنجاح' };
      mockAuthService.logout.mockResolvedValue(mockResponse);

      const result = await controller.logout(userId);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.logout).toHaveBeenCalledWith(userId);
    });
  });
});
