import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

export class CreateDocumentDto {
    @ApiProperty({
        example: 'عقد الوكالة',
        description: 'عنوان المستند',
    })
    @IsString({ message: 'العنوان يجب أن يكون نصاً' })
    @IsNotEmpty({ message: 'عنوان المستند مطلوب' })
    @MaxLength(255, { message: 'العنوان طويل جداً' })
    title: string;

    @ApiProperty({
        example: 'نسخة من عقد الوكالة الموقع',
        description: 'وصف المستند',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiProperty({
        enum: DocumentType,
        example: DocumentType.CONTRACT,
        description: 'نوع المستند',
        required: false,
    })
    @IsOptional()
    @IsEnum(DocumentType, { message: 'نوع المستند غير صالح' })
    documentType?: DocumentType;

    @ApiProperty({
        description: 'معرف القضية المرتبطة',
    })
    @IsUUID('4', { message: 'معرف القضية غير صالح' })
    @IsNotEmpty({ message: 'القضية مطلوبة' })
    caseId: string;
}
