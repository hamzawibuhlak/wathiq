import {
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolderDto {
    @ApiProperty({ example: 'مستندات العميل', description: 'اسم المجلد' })
    @IsString({ message: 'اسم المجلد يجب أن يكون نصاً' })
    @MaxLength(255, { message: 'اسم المجلد طويل جداً' })
    name: string;

    @ApiPropertyOptional({ example: '#6366f1', description: 'لون المجلد' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ example: 'folder', description: 'أيقونة المجلد' })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({ description: 'معرف المجلد الأب (للمجلدات المتداخلة)' })
    @IsOptional()
    @IsUUID('4', { message: 'معرف المجلد الأب غير صالح' })
    parentId?: string;
}

export class UpdateFolderDto {
    @ApiPropertyOptional({ example: 'مستندات العميل المحدث', description: 'اسم المجلد' })
    @IsOptional()
    @IsString({ message: 'اسم المجلد يجب أن يكون نصاً' })
    @MaxLength(255)
    name?: string;

    @ApiPropertyOptional({ example: '#6366f1', description: 'لون المجلد' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ example: 'folder', description: 'أيقونة المجلد' })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({ description: 'نقل إلى مجلد آخر' })
    @IsOptional()
    @IsUUID('4')
    parentId?: string;
}

export class LinkDocumentDto {
    @ApiProperty({ description: 'معرف المستند' })
    @IsUUID('4', { message: 'معرف المستند غير صالح' })
    documentId: string;
}
