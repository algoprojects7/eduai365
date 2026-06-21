import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateSchoolProfileDto {
  @ApiPropertyOptional({ example: 'Riverside High School' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'https://cdn.educore.ai/logos/riverside.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#2563EB' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'primaryColor must be a hex color (e.g. #2563EB)' })
  primaryColor?: string;

  @ApiPropertyOptional({ type: [String], example: ['gps', 'library'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  principalRestrictedModules?: string[];

  @ApiPropertyOptional({ example: 'March' })
  @IsOptional()
  @IsString()
  sessionEndingMonth?: string;

  @ApiPropertyOptional({ type: [String], example: ['Admission Fee', 'Security Deposit'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  admissionFeeCategories?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Tuition Fee', 'Transport Fee'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  monthlyFeeCategories?: string[];
}

