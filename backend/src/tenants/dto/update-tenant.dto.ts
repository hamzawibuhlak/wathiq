import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantDto {
    @ApiProperty({ example: 'مكتب الوثيق للمحاماة', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: 'Al Watheeq Law Office', required: false })
    @IsOptional()
    @IsString()
    nameEn?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
    email?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ required: false, description: 'رقم السجل التجاري' })
    @IsOptional()
    @IsString()
    commercialReg?: string;

    @ApiProperty({ required: false, description: 'الرقم الضريبي' })
    @IsOptional()
    @IsString()
    taxNumber?: string;

    @ApiProperty({ required: false, description: 'الموقع الإلكتروني' })
    @IsOptional()
    @IsString()
    website?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    licenseNumber?: string;

    @ApiProperty({ required: false, description: 'رابط ورقة الهيد ليتر للمكتب' })
    @IsOptional()
    @IsString()
    letterheadUrl?: string;
}
