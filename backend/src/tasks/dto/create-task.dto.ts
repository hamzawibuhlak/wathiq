import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
    @ApiProperty({ description: 'عنوان المهمة' })
    @IsString()
    title: string;

    @ApiPropertyOptional({ description: 'وصف المهمة' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({ description: 'تاريخ التسليم' })
    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @ApiPropertyOptional({ description: 'وقت التسليم (HH:mm)' })
    @IsOptional()
    @IsString()
    dueTime?: string;

    @ApiPropertyOptional({ description: 'معرف القضية المرتبطة' })
    @IsOptional()
    @IsUUID()
    caseId?: string;

    @ApiPropertyOptional({ description: 'معرف الجلسة المرتبطة' })
    @IsOptional()
    @IsUUID()
    hearingId?: string;

    @ApiProperty({ description: 'معرف المستخدم الأساسي المعين للمهمة' })
    @IsUUID()
    assignedToId: string;

    @ApiPropertyOptional({ description: 'معرفات المستخدمين الإضافيين المعينين', type: [String] })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    assignedToIds?: string[];

    @ApiPropertyOptional({ description: 'معرف المهمة الأب (للمهام الفرعية)' })
    @IsOptional()
    @IsUUID()
    parentId?: string;

    @ApiPropertyOptional({ description: 'الوسوم', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}
