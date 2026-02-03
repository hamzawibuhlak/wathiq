import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        example: 'lawyer@example.com',
        description: 'البريد الإلكتروني',
    })
    @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
    @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
    email: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'كلمة المرور',
    })
    @IsString()
    @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
    @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
    @MaxLength(50, { message: 'كلمة المرور طويلة جداً' })
    password: string;
}
