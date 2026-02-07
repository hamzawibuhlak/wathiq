import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExecuteReportDto {
  @ApiProperty({ 
    enum: ['PDF', 'EXCEL', 'CSV', 'JSON'], 
    example: 'EXCEL',
    description: 'صيغة التصدير'
  })
  @IsEnum(['PDF', 'EXCEL', 'CSV', 'JSON'])
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
}
