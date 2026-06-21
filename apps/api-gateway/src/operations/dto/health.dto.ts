import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class HealthRecordsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;
}

export class UpdateHealthRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  allergies?: string[];

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  vaccinations?: Record<string, unknown>[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bmi?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastCheckup?: string;
}

export class CreateInfirmaryVisitDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty()
  @IsDateString()
  visitDate!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  complaint!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  treatment!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  referred?: boolean;
}

export class InfirmaryVisitsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;
}
