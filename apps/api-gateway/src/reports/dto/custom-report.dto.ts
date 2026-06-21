import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export const CHART_TYPES = ['bar', 'line', 'pie', 'area'] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export const EXPORT_FORMATS = ['pdf', 'xlsx'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export class CustomReportPreviewDto {
  @ApiProperty({
    example: ['students.enrolled', 'attendance.rate', 'fees.collected'],
    description: 'Selected metric identifiers from the report builder',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  metrics!: string[];

  @ApiProperty({ enum: CHART_TYPES, example: 'bar' })
  @IsIn(CHART_TYPES)
  chartType!: ChartType;

  @ApiPropertyOptional({ example: 'class' })
  @IsOptional()
  @IsString()
  groupBy?: string;

  @ApiPropertyOptional({ example: '2025-04-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class CustomReportExportDto extends CustomReportPreviewDto {
  @ApiProperty({ enum: EXPORT_FORMATS, example: 'pdf' })
  @IsIn(EXPORT_FORMATS)
  format!: ExportFormat;

  @ApiPropertyOptional({ example: 'Term II Summary Report' })
  @IsOptional()
  @IsString()
  title?: string;
}
