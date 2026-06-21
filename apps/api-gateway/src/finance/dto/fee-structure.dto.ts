import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { FeeHeadCategory, ScholarshipType } from '@eduai365/database';

const FEE_HEAD_CATEGORIES: FeeHeadCategory[] = [
  'TUITION',
  'ADMISSION',
  'EXAM',
  'TRANSPORT',
  'LIBRARY',
  'LAB',
  'SPORTS',
  'MEALS',
  'UNIFORM',
  'LATE_FINE',
  'OTHER',
];

const SCHOLARSHIP_TYPES: ScholarshipType[] = [
  'MERIT',
  'NEED',
  'STAFF_WARD',
  'SPORTS',
  'OTHER',
];

export class CreateFeeHeadDto {
  @ApiProperty({ example: 'Tuition Fee' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'TUITION' })
  @IsString()
  @MinLength(1)
  code!: string;

  @ApiProperty({ enum: FEE_HEAD_CATEGORIES })
  @IsEnum(FEE_HEAD_CATEGORIES)
  category!: FeeHeadCategory;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}

export class UpdateFeeHeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ enum: FEE_HEAD_CATEGORIES })
  @IsOptional()
  @IsEnum(FEE_HEAD_CATEGORIES)
  category?: FeeHeadCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}

export class FeeMatrixQueryDto {
  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @MinLength(1)
  academicYear!: string;
}

export class FeeMatrixEntryDto {
  @ApiProperty()
  @IsString()
  grade!: string;

  @ApiProperty()
  @IsString()
  feeHeadId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;
}

export class UpdateFeeMatrixDto {
  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @MinLength(1)
  academicYear!: string;

  @ApiProperty({ type: [FeeMatrixEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeMatrixEntryDto)
  entries!: FeeMatrixEntryDto[];
}

export class CreateScholarshipDto {
  @ApiProperty({ example: 'Merit Scholarship' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: SCHOLARSHIP_TYPES })
  @IsEnum(SCHOLARSHIP_TYPES)
  type!: ScholarshipType;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  discountPercent!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListConcessionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;
}

export class CreateConcessionDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scholarshipId?: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  discountPercent!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
