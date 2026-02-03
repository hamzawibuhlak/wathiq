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
import { HearingStatus } from '@prisma/client';

export class FilterHearingsDto {
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
        description: 'تصفية حسب القضية',
        required: false,
    })
    @IsOptional()
    @IsString()
    caseId?: string;

    @ApiProperty({
        description: 'تصفية حسب الحالة',
        enum: HearingStatus,
        required: false,
    })
    @IsOptional()
    @IsEnum(HearingStatus)
    status?: HearingStatus;

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
        description: 'ترتيب حسب (hearingDate, createdAt)',
        example: 'hearingDate',
        required: false,
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'hearingDate';

    @ApiProperty({
        description: 'اتجاه الترتيب (asc, desc)',
        example: 'asc',
        required: false,
    })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'asc';
}
