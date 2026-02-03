import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
    @ApiProperty({ example: 'محمد أحمد' })
    @IsString()
    @IsNotEmpty({ message: 'الاسم مطلوب' })
    name: string;

    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
    @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
    @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
    password: string;

    @ApiProperty({ example: '+966501234567', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ enum: UserRole, example: UserRole.LAWYER })
    @IsEnum(UserRole, { message: 'الدور غير صالح' })
    @IsNotEmpty({ message: 'الدور مطلوب' })
    role: UserRole;
}
