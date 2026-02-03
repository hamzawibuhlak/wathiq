import { PartialType } from '@nestjs/swagger';
import { CreateHearingDto } from './create-hearing.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHearingDto extends PartialType(CreateHearingDto) {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    outcome?: string;
}
