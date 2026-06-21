import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import type { UserRole } from '@eduai365/shared-types';

const STAFF_ROLES: UserRole[] = [
  'TEACHER',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'ACCOUNTANT',
  'RECEPTIONIST',
  'LIBRARIAN',
  'TRANSPORT_MANAGER',
  'HR_MANAGER',
  'HOSTEL_WARDEN',
  'EXAM_CONTROLLER',
  'COUNSELLOR',
];

export class ListEmployeesQueryDto {
  @ApiPropertyOptional({ enum: ['TEACHING', 'NON_TEACHING', 'CONTRACT'] })
  @IsOptional()
  @IsEnum(['TEACHING', 'NON_TEACHING', 'CONTRACT'])
  type?: 'TEACHING' | 'NON_TEACHING' | 'CONTRACT';
}

export class EnrollEmployeeDto {
  @ApiProperty({ example: 'staff@greenfield.educore.ai' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Priya' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({ enum: STAFF_ROLES, example: 'TEACHER' })
  @IsEnum(STAFF_ROLES)
  role!: UserRole;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '+234-801-000-0099' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Science' })
  @IsString()
  department!: string;

  @ApiProperty({ example: 'Senior Teacher' })
  @IsString()
  designation!: string;

  @ApiProperty({ example: '2024-06-01' })
  @IsDateString()
  joinDate!: string;

  @ApiProperty({ example: 'O+' })
  @IsString()
  bloodGroup!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aadhaar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pan?: string;

  @ApiPropertyOptional({ example: [{ degree: 'B.Ed', institution: 'Delhi University' }] })
  @IsOptional()
  @IsArray()
  qualifications?: unknown[];

  @ApiProperty({ example: 'Grade-III' })
  @IsString()
  payGrade!: string;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  @Min(0)
  basicSalary!: number;

  @ApiProperty({ example: 18000 })
  @IsNumber()
  @Min(0)
  hra!: number;

  @ApiProperty({ example: 9000 })
  @IsNumber()
  @Min(0)
  da!: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(0)
  pfPercent!: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  tdsPercent!: number;

  @ApiProperty({ enum: ['TEACHING', 'NON_TEACHING', 'CONTRACT'] })
  @IsEnum(['TEACHING', 'NON_TEACHING', 'CONTRACT'])
  employmentType!: 'TEACHING' | 'NON_TEACHING' | 'CONTRACT';
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'David' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Mensah' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+2348010000002' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  joinDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aadhaar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  qualifications?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payGrade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  basicSalary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  hra?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  da?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pfPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  tdsPercent?: number;

  @ApiPropertyOptional({ enum: ['TEACHING', 'NON_TEACHING', 'CONTRACT'] })
  @IsOptional()
  @IsEnum(['TEACHING', 'NON_TEACHING', 'CONTRACT'])
  employmentType?: 'TEACHING' | 'NON_TEACHING' | 'CONTRACT';
}
