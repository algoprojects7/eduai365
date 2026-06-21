import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import type { HomeworkStatus } from '@eduai365/database';

const HOMEWORK_STATUSES: HomeworkStatus[] = ['DRAFT', 'PUBLISHED', 'CLOSED'];

export class ListHomeworkQueryDto {
  @ApiPropertyOptional({ example: 'clxyz123' })
  @IsOptional()
  @IsString()
  classId?: string;
}

export class CreateHomeworkDto {
  @ApiProperty({ example: 'Algebra Worksheet — Chapter 5' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: 'subxyz101' })
  @IsString()
  subjectId!: string;

  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  classId!: string;

  @ApiPropertyOptional({ example: 'secxyz456' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty({ example: '2025-09-30T23:59:59.000Z' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ enum: HOMEWORK_STATUSES, default: 'DRAFT' })
  @IsOptional()
  @IsEnum(HOMEWORK_STATUSES)
  status?: HomeworkStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
