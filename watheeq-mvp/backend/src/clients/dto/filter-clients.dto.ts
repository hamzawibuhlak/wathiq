import {
    IsInt,
    IsOptional,
    IsString,
    Min,
    Max,
    IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class FilterClientsDto {
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
        description: 'البحث في الاسم، الهاتف، البريد، الهوية',
        example: 'محمد',
        required: false,
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description: 'تصفية حسب الحالة (نشط/غير نشط)',
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({
        description: 'تصفية حسب المدينة',
        required: false,
    })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({
        description: 'ترتيب حسب (createdAt, name)',
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
