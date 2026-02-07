import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
} from '@nestjs/swagger';
import { UserInvitationsService, CreateInvitationDto, AcceptInvitationDto } from './user-invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, InvitationStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

// DTOs
export class CreateInvitationBodyDto implements CreateInvitationDto {
    @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
    email: string;

    @IsOptional()
    @IsEnum(UserRole, { message: 'الدور غير صالح' })
    role?: UserRole;
}

export class AcceptInvitationBodyDto implements AcceptInvitationDto {
    @IsNotEmpty({ message: 'الرمز مطلوب' })
    @IsString()
    token: string;

    @IsNotEmpty({ message: 'الاسم مطلوب' })
    @IsString()
    name: string;

    @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
    @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
    password: string;

    @IsOptional()
    @IsString()
    phone?: string;
}

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
    constructor(private readonly invitationsService: UserInvitationsService) {}

    // ========== Public endpoints ==========
    
    @Get('verify/:token')
    @ApiOperation({ summary: 'التحقق من صلاحية الدعوة (عام)' })
    @ApiResponse({ status: 200, description: 'معلومات الدعوة' })
    @ApiResponse({ status: 404, description: 'الدعوة غير موجودة' })
    async verifyToken(@Param('token') token: string) {
        return this.invitationsService.findByToken(token);
    }

    @Post('accept')
    @ApiOperation({ summary: 'قبول الدعوة وإنشاء حساب (عام)' })
    @ApiResponse({ status: 201, description: 'تم قبول الدعوة بنجاح' })
    @ApiResponse({ status: 400, description: 'الدعوة منتهية الصلاحية أو مستخدمة' })
    async accept(@Body() dto: AcceptInvitationBodyDto) {
        return this.invitationsService.accept(dto);
    }

    // ========== Protected endpoints (OWNER/ADMIN) ==========
    
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'الحصول على جميع الدعوات' })
    @ApiResponse({ status: 200, description: 'قائمة الدعوات' })
    async findAll(
        @TenantId() tenantId: string,
        @Query('status') status?: InvitationStatus,
    ) {
        return this.invitationsService.findAll(tenantId, status);
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'إحصائيات الدعوات' })
    async getStats(@TenantId() tenantId: string) {
        return this.invitationsService.getStats(tenantId);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'إرسال دعوة جديدة' })
    @ApiResponse({ status: 201, description: 'تم إرسال الدعوة بنجاح' })
    @ApiResponse({ status: 409, description: 'البريد الإلكتروني مسجل بالفعل' })
    async create(
        @Body() dto: CreateInvitationBodyDto,
        @TenantId() tenantId: string,
        @CurrentUser('id') inviterId: string,
    ) {
        return this.invitationsService.create(dto, tenantId, inviterId);
    }

    @Patch(':id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'إلغاء دعوة' })
    @ApiResponse({ status: 200, description: 'تم إلغاء الدعوة بنجاح' })
    async cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.invitationsService.cancel(id, tenantId);
    }

    @Patch(':id/resend')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'إعادة إرسال دعوة' })
    @ApiResponse({ status: 200, description: 'تم إعادة إرسال الدعوة بنجاح' })
    async resend(
        @Param('id', ParseUUIDPipe) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.invitationsService.resend(id, tenantId);
    }
}
