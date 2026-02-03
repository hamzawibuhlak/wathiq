import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CaseStatus, CaseType } from '@prisma/client';

export class FilterCasesDto {
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
        description: 'البحث في العنوان والوصف',
        example: 'قضية تجارية',
        required: false,
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description: 'تصفية حسب الحالة',
        enum: CaseStatus,
        required: false,
    })
    @IsOptional()
    @IsEnum(CaseStatus, { message: 'حالة القضية غير صالحة' })
    status?: CaseStatus;

    @ApiProperty({
        description: 'تصفية حسب نوع القضية',
        enum: CaseType,
        required: false,
    })
    @IsOptional()
    @IsEnum(CaseType, { message: 'نوع القضية غير صالح' })
    caseType?: CaseType;

    @ApiProperty({
        description: 'تصفية حسب العميل',
        required: false,
    })
    @IsOptional()
    @IsString()
    clientId?: string;

    @ApiProperty({
        description: 'تصفية حسب المحامي المسؤول',
        required: false,
    })
    @IsOptional()
    @IsString()
    assignedToId?: string;

    @ApiProperty({
        description: 'تصفية حسب الأولوية',
        enum: ['HIGH', 'MEDIUM', 'LOW'],
        required: false,
    })
    @IsOptional()
    @IsString()
    priority?: string;

    @ApiProperty({
        description: 'ترتيب حسب (createdAt, updatedAt, caseNumber, title)',
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
