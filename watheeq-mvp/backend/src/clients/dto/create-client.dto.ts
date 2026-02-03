import { IsNotEmpty, IsOptional, IsString, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
    @ApiProperty({ example: 'محمد عبدالله' })
    @IsString()
    @IsNotEmpty({ message: 'اسم العميل مطلوب' })
    name: string;

    @ApiProperty({ example: '+966501234567' })
    @IsString()
    @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
    phone: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({ example: '1234567890', required: false })
    @IsOptional()
    @IsString()
    nationalId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    companyName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    commercialReg?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({
        description: 'معرفات المستخدمين الذين يمكنهم رؤية هذا العميل',
        type: [String],
        required: false
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    visibleToUserIds?: string[];
}
