import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'تسجيل مكتب جديد مع المالك' })
    @ApiResponse({ status: 201, description: 'تم التسجيل بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
    @ApiResponse({ status: 409, description: 'البريد الإلكتروني مستخدم' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'تسجيل الدخول' })
    @ApiResponse({ status: 200, description: 'تم تسجيل الدخول بنجاح' })
    @ApiResponse({ status: 401, description: 'بيانات الدخول غير صحيحة' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'الحصول على بيانات المستخدم الحالي' })
    @ApiResponse({ status: 200, description: 'بيانات المستخدم' })
    @ApiResponse({ status: 401, description: 'غير مصرح' })
    async getMe(@CurrentUser('id') userId: string) {
        return this.authService.getMe(userId);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'تسجيل الخروج' })
    @ApiResponse({ status: 200, description: 'تم تسجيل الخروج بنجاح' })
    async logout(@CurrentUser('id') userId: string) {
        return this.authService.logout(userId);
    }
}
