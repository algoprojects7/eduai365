import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';

const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE'] as const;
type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export class AttendanceQueryDto {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  classId!: string;

  @ApiProperty({ example: '2025-09-15' })
  @IsDateString()
  date!: string;
}

export class AttendanceRecordDto {
  @ApiProperty({ example: 'student123' })
  @IsString()
  studentId!: string;

  @ApiProperty({ enum: ATTENDANCE_STATUSES })
  @IsEnum(ATTENDANCE_STATUSES)
  status!: AttendanceStatus;
}

export class MarkAttendanceDto {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  classId!: string;

  @ApiProperty({ example: '2025-09-15' })
  @IsDateString()
  date!: string;

  @ApiProperty({ type: [AttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records!: AttendanceRecordDto[];
}

export class GradebookQueryDto {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  classId!: string;
}
