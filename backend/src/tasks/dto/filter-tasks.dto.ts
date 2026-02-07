import { IsOptional, IsEnum, IsUUID, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class FilterTasksDto {
    @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'البحث في العنوان والوصف' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: TaskStatus, description: 'حالة المهمة' })
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @ApiPropertyOptional({ enum: TaskPriority, description: 'أولوية المهمة' })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({ description: 'معرف المستخدم المعين' })
    @IsOptional()
    @IsUUID()
    assignedToId?: string;

    @ApiPropertyOptional({ description: 'معرف القضية' })
    @IsOptional()
    @IsUUID()
    caseId?: string;

    @ApiPropertyOptional({ description: 'معرف الجلسة' })
    @IsOptional()
    @IsUUID()
    hearingId?: string;

    @ApiPropertyOptional({ description: 'ترتيب حسب', default: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';

    @ApiPropertyOptional({ description: 'المهام المتأخرة فقط' })
    @IsOptional()
    @Type(() => Boolean)
    overdue?: boolean;

    @ApiPropertyOptional({ description: 'المهام بدون مهام أب فقط (المهام الرئيسية)' })
    @IsOptional()
    @Type(() => Boolean)
    rootOnly?: boolean;
}
