import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClientDto extends PartialType(CreateClientDto) {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
