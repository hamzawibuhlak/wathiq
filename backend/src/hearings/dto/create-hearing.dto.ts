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
    @ApiProperty()
    @IsDateString()
    @IsNotEmpty({ message: 'تاريخ الجلسة مطلوب' })
    hearingDate: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    courtName?: string;

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

    @ApiProperty()
    @IsUUID('4', { message: 'معرف القضية غير صالح' })
    @IsNotEmpty({ message: 'القضية مطلوبة' })
    caseId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'معرف العميل غير صالح' })
    clientId?: string;

    @ApiProperty({ required: false, description: 'المحامي المسؤول عن الجلسة' })
    @IsOptional()
    @IsUUID('4', { message: 'معرف المحامي غير صالح' })
    assignedToId?: string;
}
