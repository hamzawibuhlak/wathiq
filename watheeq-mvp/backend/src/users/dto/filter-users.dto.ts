import {
    IsInt,
    IsOptional,
    IsString,
    IsEnum,
    IsBoolean,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class FilterUsersDto {
    @ApiProperty({
        description: 'رقم الصفحة',
        example: 1,
        required: false,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({
        description: 'عدد العناصر في الصفحة',
        example: 10,
        required: false,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiProperty({
        description: 'البحث في الاسم أو البريد',
        required: false,
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description: 'تصفية حسب الدور',
        enum: UserRole,
        required: false,
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiProperty({
        description: 'تصفية حسب الحالة (نشط/غير نشط)',
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({
        description: 'ترتيب حسب (createdAt, name, email)',
        example: 'createdAt',
        required: false,
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiProperty({
        description: 'اتجاه الترتيب (asc, desc)',
        example: 'desc',
        required: false,
    })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';
}
