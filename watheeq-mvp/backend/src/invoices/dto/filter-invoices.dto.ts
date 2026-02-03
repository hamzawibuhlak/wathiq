import {
    IsInt,
    IsOptional,
    IsString,
    IsEnum,
    IsDateString,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '@prisma/client';

export class FilterInvoicesDto {
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
        description: 'تصفية حسب الحالة',
        enum: InvoiceStatus,
        required: false,
    })
    @IsOptional()
    @IsEnum(InvoiceStatus)
    status?: InvoiceStatus;

    @ApiProperty({
        description: 'تصفية حسب العميل',
        required: false,
    })
    @IsOptional()
    @IsString()
    clientId?: string;

    @ApiProperty({
        description: 'تصفية حسب القضية',
        required: false,
    })
    @IsOptional()
    @IsString()
    caseId?: string;

    @ApiProperty({
        description: 'تاريخ البداية',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiProperty({
        description: 'تاريخ النهاية',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiProperty({
        description: 'ترتيب حسب (createdAt, dueDate, totalAmount)',
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
