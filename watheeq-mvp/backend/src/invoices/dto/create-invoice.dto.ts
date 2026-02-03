import {
    IsDateString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    IsArray,
    ValidateNested,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class InvoiceItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    quantity: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    unitPrice: number;
}

export class CreateInvoiceDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 5000, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    amount?: number;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty({ message: 'تاريخ الاستحقاق مطلوب' })
    dueDate: string;

    @ApiProperty()
    @IsUUID('4', { message: 'معرف العميل غير صالح' })
    @IsNotEmpty({ message: 'العميل مطلوب' })
    clientId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'معرف القضية غير صالح' })
    caseId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ required: false, description: 'نسبة الضريبة' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    @Type(() => Number)
    taxRate?: number;

    @ApiProperty({ required: false, type: [InvoiceItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    items?: InvoiceItemDto[];
}
