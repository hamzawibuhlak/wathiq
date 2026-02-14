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

    // Enhanced Company Info
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    brandName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    unifiedNumber?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    commercialRegDoc?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    nationalAddressDoc?: string;

    // Representative Info
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    repName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    repPhone?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    repEmail?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    repIdentity?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    repDocType?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    repDoc?: string;
}
