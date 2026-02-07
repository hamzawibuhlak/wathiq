import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkflowTrigger } from '@prisma/client';

export class CreateWorkflowDto {
    @ApiProperty({ description: 'اسم سير العمل' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'وصف سير العمل' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: WorkflowTrigger, description: 'نوع المحفز' })
    @IsEnum(WorkflowTrigger)
    triggerType: WorkflowTrigger;

    @ApiPropertyOptional({ description: 'إعدادات المحفز' })
    @IsOptional()
    @IsObject()
    triggerConfig?: Record<string, any>;

    @ApiProperty({ description: 'الإجراءات', type: 'array' })
    @IsObject({ each: true })
    actions: Record<string, any>[];

    @ApiPropertyOptional({ description: 'مفعل', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
