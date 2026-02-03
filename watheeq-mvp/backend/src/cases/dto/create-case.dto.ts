import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CaseType, CaseStatus, CasePriority } from '@prisma/client';

export class CreateCaseDto {
    @ApiProperty({ example: 'قضية تجارية رقم 123' })
    @IsString()
    @IsNotEmpty({ message: 'عنوان القضية مطلوب' })
    title: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: CaseType, example: CaseType.COMMERCIAL })
    @IsEnum(CaseType, { message: 'نوع القضية غير صالح' })
    caseType: CaseType;

    @ApiProperty({ enum: CaseStatus, default: CaseStatus.OPEN })
    @IsOptional()
    @IsEnum(CaseStatus)
    status?: CaseStatus;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    courtName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    courtCaseNumber?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    filingDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    nextHearingDate?: string;

    @ApiProperty()
    @IsUUID('4', { message: 'معرف العميل غير صالح' })
    @IsNotEmpty({ message: 'العميل مطلوب' })
    clientId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID('4', { message: 'معرف المحامي غير صالح' })
    assignedToId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ enum: CasePriority, default: CasePriority.MEDIUM })
    @IsOptional()
    @IsEnum(CasePriority)
    priority?: CasePriority;

    @ApiProperty({ required: false, description: 'الخصم' })
    @IsOptional()
    @IsString()
    opposingParty?: string;
}
