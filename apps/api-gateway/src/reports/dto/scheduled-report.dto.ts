import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CHART_TYPES, EXPORT_FORMATS } from './custom-report.dto';

const SCHEDULE_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;

export class CreateScheduledReportDto {
  @ApiProperty({ example: 'Weekly Fee Collection Summary' })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({
    example: '0 8 * * 1',
    description: 'Cron expression for report delivery schedule',
  })
  @IsString()
  @MinLength(5)
  cronExpression!: string;

  @ApiProperty({
    enum: SCHEDULE_FREQUENCIES,
    example: 'weekly',
    description: 'Human-readable schedule frequency label',
  })
  @IsIn(SCHEDULE_FREQUENCIES)
  frequency!: (typeof SCHEDULE_FREQUENCIES)[number];

  @ApiProperty({ example: ['finance.collected', 'finance.overdue'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  metrics!: string[];

  @ApiPropertyOptional({ enum: CHART_TYPES, default: 'bar' })
  @IsOptional()
  @IsIn(CHART_TYPES)
  chartType?: (typeof CHART_TYPES)[number];

  @ApiProperty({ enum: EXPORT_FORMATS, example: 'pdf' })
  @IsIn(EXPORT_FORMATS)
  format!: (typeof EXPORT_FORMATS)[number];

  @ApiProperty({ example: ['principal@school.edu', 'accountant@school.edu'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  recipients!: string[];
}
