import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HearingStatus } from '@prisma/client';

export class CreateHearingDto {
    @ApiProperty({ description: 'رقم الجلسة من المحكمة' })
    @IsString()
    @IsNotEmpty({ message: 'رقم الجلسة مطلوب' })
    hearingNumber: string;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty({ message: 'تاريخ الجلسة مطلوب' })
    hearingDate: string;

    @ApiProperty({ description: 'الموكل' })
    @IsOptional()
    @IsUUID('4', { message: 'معرف العميل غير صالح' })
    clientId?: string;

    @ApiProperty({ required: false, description: 'القضية - اختياري' })
    @IsOptional()
    @IsUUID('4', { message: 'معرف القضية غير صالح' })
    caseId?: string;

    @ApiProperty({ description: 'المحامي المسؤول عن الجلسة - إجباري' })
    @IsUUID('4', { message: 'معرف المحامي غير صالح' })
    @IsNotEmpty({ message: 'المحامي مطلوب' })
    assignedToId: string;

    @ApiProperty({ required: false, description: 'اسم الخصم' })
    @IsOptional()
    @IsString()
    opponentName?: string;

    @ApiProperty({ required: false, description: 'اسم المحكمة' })
    @IsOptional()
    @IsString()
    courtName?: string;

    @ApiProperty({ required: false, description: 'اسم القاضي' })
    @IsOptional()
    @IsString()
    judgeName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    courtroom?: string;

    @ApiProperty({ enum: HearingStatus, default: HearingStatus.SCHEDULED })
    @IsOptional()
    @IsEnum(HearingStatus)
    status?: HearingStatus;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}
