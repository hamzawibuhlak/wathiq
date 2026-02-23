import {
    Controller,
    Post,
    Get,
    Body,
    Param,
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
import { EmailVerificationService } from './email-verification.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly twoFactorService: TwoFactorService,
        private readonly emailVerificationService: EmailVerificationService,
    ) { }

    @Get('check-slug/:slug')
    @ApiOperation({ summary: 'التحقق من توفر اسم الرابط' })
    @ApiResponse({ status: 200, description: 'حالة توفر الرابط' })
    async checkSlug(@Param('slug') slug: string) {
        return this.authService.checkSlugAvailability(slug);
    }

    @Post('register')
    @ApiOperation({ summary: 'تسجيل مكتب جديد مع المالك' })
    @ApiResponse({ status: 201, description: 'تم التسجيل بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
    @ApiResponse({ status: 409, description: 'البريد الإلكتروني مستخدم' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'التحقق من البريد الإلكتروني بالرمز' })
    @ApiResponse({ status: 200, description: 'تم التحقق بنجاح' })
    @ApiResponse({ status: 400, description: 'رمز غير صحيح أو منتهي' })
    async verifyEmail(@Body() body: { email: string; code: string }) {
        return this.authService.verifyEmail(body.email, body.code);
    }

    @Post('resend-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'إعادة إرسال رمز التحقق' })
    @ApiResponse({ status: 200, description: 'تم الإرسال' })
    async resendOTP(@Body() body: { email: string }) {
        return this.emailVerificationService.resendOTP(body.email);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'تسجيل الدخول' })
    @ApiResponse({ status: 200, description: 'تم تسجيل الدخول بنجاح' })
    @ApiResponse({ status: 401, description: 'بيانات الدخول غير صحيحة' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'طلب إعادة تعيين كلمة المرور' })
    @ApiResponse({ status: 200, description: 'تم إرسال الرابط' })
    async forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
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

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'تغيير كلمة المرور' })
    @ApiResponse({ status: 200, description: 'تم تغيير كلمة المرور بنجاح' })
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
    @ApiResponse({ status: 200, description: 'تم إنشاء السر و QR code' })
    async generate2FASecret(@CurrentUser('id') userId: string) {
        return this.twoFactorService.generateSecret(userId);
    }

    @Post('2fa/enable')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'تفعيل المصادقة الثنائية' })
    @ApiResponse({ status: 200, description: 'تم تفعيل المصادقة الثنائية' })
    @ApiResponse({ status: 401, description: 'رمز غير صحيح' })
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
    @ApiResponse({ status: 200, description: 'تم إلغاء المصادقة الثنائية' })
    @ApiResponse({ status: 401, description: 'رمز غير صحيح' })
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
    @ApiResponse({ status: 200, description: 'تم تجديد الرموز' })
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
    @ApiResponse({ status: 200, description: 'حالة 2FA' })
    async get2FAStatus(@CurrentUser('id') userId: string) {
        const enabled = await this.twoFactorService.has2FAEnabled(userId);
        return { enabled };
    }
}
