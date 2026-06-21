import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import type { UserRole } from '@eduai365/shared-types';

const TEACHER_ROLES: UserRole[] = [
  'TEACHER',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'EXAM_CONTROLLER',
  'COUNSELLOR',
  'LIBRARIAN',
  'ACCOUNTANT',
  'RECEPTIONIST',
  'TRANSPORT_MANAGER',
  'HR_MANAGER',
  'HOSTEL_WARDEN',
];

export class CreateTeacherDto {
  @ApiProperty({ example: 'teacher@riverside.educore.ai' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Sarah' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Johnson' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({ enum: TEACHER_ROLES, example: 'TEACHER' })
  @IsEnum(TEACHER_ROLES)
  role!: UserRole;

  @ApiPropertyOptional({ example: '+1-555-0100' })
  @IsOptional()
  @IsString()
  phone?: string;
}
