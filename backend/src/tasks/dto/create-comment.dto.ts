import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MentionDto {
    type: string; // 'user' | 'case' | 'client' | 'hearing' | 'document' | 'invoice'
    id: string;
    name: string;
}

export class CreateCommentDto {
    @ApiProperty({ description: 'محتوى التعليق' })
    @IsString()
    content: string;

    @ApiPropertyOptional({ description: 'المنشنات في التعليق', type: 'array' })
    @IsOptional()
    @IsArray()
    mentions?: MentionDto[];
}
