import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import type { StudentStatus } from '@eduai365/database';

const STUDENT_STATUSES: StudentStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'GRADUATED',
  'TRANSFERRED',
  'WITHDRAWN',
];

export class CreateStudentDto {
  @ApiProperty({ example: 'ADM-2026-0042' })
  @IsString()
  @MinLength(2)
  admissionNo!: string;

  @ApiProperty({ example: 'Aisha' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Khan' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiPropertyOptional({ example: 'clxyz123' })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({ example: 'secxyz456' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ enum: STUDENT_STATUSES, default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(STUDENT_STATUSES)
  status?: StudentStatus;
}
