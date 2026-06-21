import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import type { StudentStatus } from '@eduai365/database';

const STUDENT_STATUSES: StudentStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'GRADUATED',
  'TRANSFERRED',
  'WITHDRAWN',
];

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 'ADM-2026-0042' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  admissionNo?: string;

  @ApiPropertyOptional({ example: 'Aisha' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Khan' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectionId?: string | null;

  @ApiPropertyOptional({ enum: STUDENT_STATUSES })
  @IsOptional()
  @IsEnum(STUDENT_STATUSES)
  status?: StudentStatus;
}
