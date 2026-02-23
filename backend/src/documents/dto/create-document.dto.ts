import {
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    IsArray,
    IsBoolean,
    IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateDocumentDto {
    @ApiPropertyOptional({
        example: 'عقد الوكالة',
        description: 'عنوان المستند',
    })
    @IsOptional()
    @IsString({ message: 'العنوان يجب أن يكون نصاً' })
    @MaxLength(255, { message: 'العنوان طويل جداً' })
    title?: string;

    @ApiPropertyOptional({
        example: 'نسخة من عقد الوكالة الموقع',
        description: 'وصف المستند',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiPropertyOptional({
        enum: DocumentType,
        example: DocumentType.CONTRACT,
        description: 'نوع المستند',
    })
    @IsOptional()
    @IsEnum(DocumentType, { message: 'نوع المستند غير صالح' })
    documentType?: DocumentType;

    @ApiPropertyOptional({
        description: 'معرف القضية المرتبطة',
    })
    @IsOptional()
    @IsUUID('4', { message: 'معرف القضية غير صالح' })
    caseId?: string;

    @ApiPropertyOptional({
        type: [String],
        description: 'معرفات القضايا المرتبطة (لربط المستند بأكثر من قضية)',
    })
    @IsOptional()
    caseIds?: string[] | string;

    @ApiPropertyOptional({
        type: [String],
        description: 'الوسوم',
    })
    @IsOptional()
    tags?: string[] | string;
}

export class UpdateDocumentDto {
    @ApiPropertyOptional({
        example: 'عقد الوكالة المحدث',
        description: 'عنوان المستند',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({
        description: 'وصف المستند',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiPropertyOptional({
        enum: DocumentType,
        description: 'نوع المستند',
    })
    @IsOptional()
    @IsEnum(DocumentType)
    documentType?: DocumentType;

    @ApiPropertyOptional({
        type: [String],
        description: 'الوسوم',
    })
    @IsOptional()
    tags?: string[] | string;
}

export class FilterDocumentsDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: DocumentType })
    @IsOptional()
    @IsEnum(DocumentType)
    documentType?: DocumentType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    caseId?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fromDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    toDate?: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    onlyLatest?: boolean;
}

export class BulkDeleteDto {
    @ApiProperty({ type: [String] })
    @IsArray()
    @IsUUID('4', { each: true })
    ids: string[];
}

export class CreateTemplateDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: DocumentType })
    @IsEnum(DocumentType)
    category: DocumentType;
}
