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
import { TwoFactorService } from './two-factor.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly twoFactorService: TwoFactorService,
    ) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'تسجيل الدخول' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'طلب إعادة تعيين كلمة المرور' })
    async forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'الحصول على بيانات المستخدم الحالي' })
    async getMe(@CurrentUser('id') userId: string) {
        return this.authService.getMe(userId);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'تسجيل الخروج' })
    async logout(@CurrentUser('id') userId: string) {
        return this.authService.logout(userId);
    }

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'تغيير كلمة المرور' })
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() data: { currentPassword: string; newPassword: string; confirmPassword: string },
    ) {
        return this.authService.changePassword(userId, data);
    }

    @Post('2fa/generate')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'إنشاء سر المصادقة الثنائية' })
    async generate2FASecret(@CurrentUser('id') userId: string) {
        return this.twoFactorService.generateSecret(userId);
    }

    @Post('2fa/enable')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'تفعيل المصادقة الثنائية' })
    async enable2FA(
        @CurrentUser('id') userId: string,
        @Body('token') token: string,
    ) {
        return this.twoFactorService.enable(userId, token);
    }

    @Post('2fa/disable')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'إلغاء المصادقة الثنائية' })
    async disable2FA(
        @CurrentUser('id') userId: string,
        @Body('token') token: string,
    ) {
        return this.twoFactorService.disable(userId, token);
    }

    @Post('2fa/regenerate-backup')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'تجديد رموز النسخ الاحتياطي' })
    async regenerateBackupCodes(
        @CurrentUser('id') userId: string,
        @Body('token') token: string,
    ) {
        return this.twoFactorService.regenerateBackupCodes(userId, token);
    }

    @Get('2fa/status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'حالة المصادقة الثنائية' })
    async get2FAStatus(@CurrentUser('id') userId: string) {
        const enabled = await this.twoFactorService.has2FAEnabled(userId);
        return { enabled };
    }
}
