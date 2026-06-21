import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class AttendanceQrDto {
  @ApiProperty({ example: 'student_cuid_123' })
  @IsString()
  studentId!: string;

  @ApiProperty({ example: '2025-09-15T08:30:00.000Z' })
  @IsDateString()
  timestamp!: string;
}
