import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

const REPORT_TYPES = ['term', 'annual', 'class', 'student'] as const;
const REPORT_TONES = ['formal', 'supportive', 'concise'] as const;

export class GenerateReportNarrativeDto {
  @ApiProperty({ enum: REPORT_TYPES })
  @IsIn(REPORT_TYPES)
  reportType!: (typeof REPORT_TYPES)[number];

  @ApiPropertyOptional({ example: 'Science' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: 'Grade 8' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ example: 'Priya Sharma' })
  @IsOptional()
  @IsString()
  studentName?: string;

  @ApiProperty({
    example: { averageScore: 78, attendanceRate: 92, rank: 5 },
  })
  @IsObject()
  @IsNotEmpty()
  metrics!: Record<string, number | string>;

  @ApiPropertyOptional({ enum: REPORT_TONES, default: 'formal' })
  @IsOptional()
  @IsIn(REPORT_TONES)
  tone?: (typeof REPORT_TONES)[number];
}
