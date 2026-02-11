import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsEnum,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    // ── بيانات الشركة ──────────────────────────
    @ApiProperty({
        example: 'مكتب وسم الثيقاء',
        description: 'اسم مكتب المحاماة',
    })
    @IsString({ message: 'اسم المكتب يجب أن يكون نصاً' })
    @IsNotEmpty({ message: 'اسم المكتب مطلوب' })
    @MinLength(2, { message: 'اسم المكتب يجب أن يكون حرفين على الأقل' })
    @MaxLength(200, { message: 'اسم المكتب طويل جداً' })
    officeName: string;

    @ApiProperty({
        example: 'wasmaltheeqa',
        description: 'رابط الشركة — حروف إنجليزية وأرقام وشرطة فقط',
    })
    @IsString()
    @IsNotEmpty({ message: 'اسم الرابط مطلوب' })
    @Matches(/^[a-z0-9-]+$/, {
        message: 'الـ Slug يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطة فقط',
    })
    @MinLength(3, { message: 'الـ Slug لا يقل عن 3 أحرف' })
    @MaxLength(30, { message: 'الـ Slug لا يزيد عن 30 حرف' })
    slug: string;

    @ApiProperty({ example: 'الرياض', required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ example: '1234567890', required: false })
    @IsOptional()
    @IsString()
    licenseNumber?: string;

    // ── بيانات المالك ───────────────────────────
    @ApiProperty({
        example: 'سالم العتيبي',
        description: 'الاسم الكامل للمالك',
    })
    @IsString({ message: 'الاسم يجب أن يكون نصاً' })
    @IsNotEmpty({ message: 'الاسم مطلوب' })
    @MinLength(2, { message: 'الاسم يجب أن يكون حرفين على الأقل' })
    @MaxLength(100, { message: 'الاسم طويل جداً' })
    name: string;

    @ApiProperty({
        example: 'salem@example.com',
        description: 'البريد الإلكتروني',
    })
    @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
    @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
    email: string;

    @ApiProperty({
        example: '+966501234567',
        description: 'رقم الهاتف (اختياري)',
        required: false,
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({
        example: 'StrongPass123',
        description: 'كلمة المرور (8 أحرف على الأقل)',
    })
    @IsString()
    @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
    @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
    @MaxLength(50, { message: 'كلمة المرور طويلة جداً' })
    password: string;

    // ── الباقة ──────────────────────────────────
    @ApiProperty({
        enum: ['BASIC', 'PROFESSIONAL', 'ENTERPRISE'],
        required: false,
    })
    @IsOptional()
    @IsEnum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE'], {
        message: 'نوع الباقة غير صالح',
    })
    planType?: string;
}
