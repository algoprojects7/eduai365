import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import type { AdmissionStage } from '@eduai365/database';

const ADMISSION_STAGES: AdmissionStage[] = [
  'INQUIRY',
  'APPLICATION',
  'ENTRANCE_TEST',
  'INTERVIEW',
  'OFFER',
  'FEE_PAID',
  'ENROLLED',
];

export class ListAdmissionsQueryDto {
  @ApiPropertyOptional({ enum: ADMISSION_STAGES })
  @IsOptional()
  @IsEnum(ADMISSION_STAGES)
  stage?: AdmissionStage;

  @ApiPropertyOptional({ description: 'When true, group results by stage for kanban' })
  @IsOptional()
  @IsString()
  groupBy?: string;
}

export class CreateAdmissionDto {
  @ApiProperty({ example: 'Amina Bello' })
  @IsString()
  @MinLength(1)
  applicantName!: string;

  @ApiProperty({ example: 'Ibrahim Bello' })
  @IsString()
  @MinLength(1)
  parentName!: string;

  @ApiProperty({ example: 'parent@example.com' })
  @IsEmail()
  parentEmail!: string;

  @ApiProperty({ example: '+234-801-000-0000' })
  @IsString()
  @MinLength(5)
  parentPhone!: string;

  @ApiProperty({ example: 'Class 8' })
  @IsString()
  @MinLength(1)
  targetClass!: string;

  @ApiPropertyOptional({ example: 'Previous Academy' })
  @IsOptional()
  @IsString()
  previousSchool?: string;

  @ApiPropertyOptional({ enum: ADMISSION_STAGES, default: 'INQUIRY' })
  @IsOptional()
  @IsEnum(ADMISSION_STAGES)
  stage?: AdmissionStage;

  @ApiProperty({ example: 'Male', enum: ['Male', 'Female', 'Other'] })
  @IsString()
  @IsIn(['Male', 'Female', 'Other'])
  gender!: string;

  @ApiProperty({ example: '2012-06-15', description: 'ISO date string YYYY-MM-DD' })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ example: '123 Main Street, Lagos' })
  @IsString()
  address!: string;

  @ApiPropertyOptional({ example: '+234-801-000-0000' })
  @IsOptional()
  @IsString()
  parentWhatsapp?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  documents?: Record<string, unknown>[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAdmissionDto {
  @ApiPropertyOptional({ enum: ADMISSION_STAGES })
  @IsOptional()
  @IsEnum(ADMISSION_STAGES)
  stage?: AdmissionStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 85.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  aiScore?: number;
}

export class AdvanceAdmissionStageDto {
  @ApiPropertyOptional({ enum: ADMISSION_STAGES })
  @IsOptional()
  @IsEnum(ADMISSION_STAGES)
  stage?: AdmissionStage;
}
