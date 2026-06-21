import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import type { ExamStatus } from '@eduai365/database';

const EXAM_STATUSES: ExamStatus[] = [
  'DRAFT',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'PUBLISHED',
];

export class CreateExamDto {
  @ApiProperty({ example: 'Mid-Term Examination' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'Term 1' })
  @IsString()
  @MinLength(1)
  term!: string;

  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @MinLength(4)
  academicYear!: string;

  @ApiPropertyOptional({ enum: EXAM_STATUSES, default: 'DRAFT' })
  @IsOptional()
  @IsEnum(EXAM_STATUSES)
  status?: ExamStatus;

  @ApiProperty({ example: '2025-10-15' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2025-10-25' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ type: [String], description: 'Class IDs or grade labels' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classes?: string[];
}

export class UpdateExamStatusDto {
  @ApiProperty({ enum: EXAM_STATUSES })
  @IsEnum(EXAM_STATUSES)
  status!: ExamStatus;
}

export class CreateExamScheduleEntryDto {
  @ApiProperty({ example: 'subxyz101' })
  @IsString()
  subjectId!: string;

  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  classId!: string;

  @ApiProperty({ example: '2025-10-15' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  startTime!: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  endTime!: string;

  @ApiPropertyOptional({ example: 'Hall A' })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxMarks!: number;
}

export class ExamResultsQueryDto {
  @ApiPropertyOptional({ example: 'clxyz123' })
  @IsOptional()
  @IsString()
  classId?: string;
}

export class UpdateExamResultDto {
  @ApiProperty({ example: 'subxyz101' })
  @IsString()
  subjectId!: string;

  @ApiProperty({ example: 78.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marksObtained!: number;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxMarks!: number;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ReportCardsQueryDto {
  @ApiPropertyOptional({ example: 'stuxyz001' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ example: 'Term 1' })
  @IsOptional()
  @IsString()
  term?: string;
}

export class ClassReportCardsQueryDto {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  classId!: string;

  @ApiPropertyOptional({ example: 'Term 1' })
  @IsOptional()
  @IsString()
  term?: string;
}
