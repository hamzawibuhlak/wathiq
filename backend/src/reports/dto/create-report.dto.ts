import { IsString, IsNotEmpty, IsEnum, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ example: 'تقرير القضايا الشهري' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ملخص شامل للقضايا خلال الشهر', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    enum: ['CASES_SUMMARY', 'CASES_DETAILED', 'HEARINGS_SCHEDULE', 'FINANCIAL_SUMMARY', 'CLIENT_ACTIVITY', 'LAWYER_PERFORMANCE', 'INVOICES_AGING', 'CUSTOM'],
    example: 'CASES_SUMMARY'
  })
  @IsEnum(['CASES_SUMMARY', 'CASES_DETAILED', 'HEARINGS_SCHEDULE', 'FINANCIAL_SUMMARY', 'CLIENT_ACTIVITY', 'LAWYER_PERFORMANCE', 'INVOICES_AGING', 'CUSTOM'])
  reportType: string;

  @ApiProperty({ 
    example: { dateFrom: '2024-01-01', dateTo: '2024-01-31', status: 'OPEN' },
    description: 'تكوين التقرير (الفلاتر، الأعمدة، التجميع)'
  })
  @IsObject()
  config: Record<string, any>;
}
