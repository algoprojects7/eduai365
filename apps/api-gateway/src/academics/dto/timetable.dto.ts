import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class ClassTimetableQueryDto {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  classId!: string;

  @ApiPropertyOptional({ example: 'secxyz456' })
  @IsOptional()
  @IsString()
  sectionId?: string;
}

export class TeacherTimetableQueryDto {
  @ApiProperty({ example: 'usrxyz789' })
  @IsString()
  teacherId!: string;
}

export class UpsertTimetableSlotDto {
  @ApiPropertyOptional({ description: 'Existing slot ID for update' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  classId!: string;

  @ApiPropertyOptional({ example: 'secxyz456' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ example: 'usrxyz789' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiPropertyOptional({ example: 'subxyz101' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ example: 1, description: '1=Mon … 6=Sat' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: 1, description: 'Period 1–8' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  period!: number;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @MinLength(4)
  startTime!: string;

  @ApiProperty({ example: '08:45' })
  @IsString()
  @MinLength(4)
  endTime!: string;

  @ApiPropertyOptional({ example: 'Room 101' })
  @IsOptional()
  @IsString()
  room?: string;
}

export class TimetableConflictsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teacherId?: string;
}
