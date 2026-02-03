import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        example: 'محمد أحمد',
        description: 'الاسم الكامل للمستخدم',
    })
    @IsString({ message: 'الاسم يجب أن يكون نصاً' })
    @IsNotEmpty({ message: 'الاسم مطلوب' })
    @MinLength(2, { message: 'الاسم يجب أن يكون حرفين على الأقل' })
    @MaxLength(100, { message: 'الاسم طويل جداً' })
    name: string;

    @ApiProperty({
        example: 'lawyer@example.com',
        description: 'البريد الإلكتروني',
    })
    @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
    @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
    email: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'كلمة المرور (6 أحرف على الأقل)',
    })
    @IsString()
    @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
    @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
    @MaxLength(50, { message: 'كلمة المرور طويلة جداً' })
    password: string;

    @ApiProperty({
        example: 'مكتب الوثيق للمحاماة',
        description: 'اسم مكتب المحاماة',
    })
    @IsString({ message: 'اسم المكتب يجب أن يكون نصاً' })
    @IsNotEmpty({ message: 'اسم المكتب مطلوب' })
    @MinLength(2, { message: 'اسم المكتب يجب أن يكون حرفين على الأقل' })
    @MaxLength(200, { message: 'اسم المكتب طويل جداً' })
    officeName: string;

    @ApiProperty({
        example: '+966501234567',
        description: 'رقم الهاتف (اختياري)',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Matches(/^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/, {
        message: 'رقم الهاتف غير صالح',
    })
    phone?: string;
}
