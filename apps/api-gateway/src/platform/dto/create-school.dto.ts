import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import type { TenantPlan } from '@eduai365/shared-types';

const TENANT_PLANS: TenantPlan[] = ['CORE', 'PRO', 'ENTERPRISE'];

export class CreateSchoolDto {
  @ApiProperty({ example: 'Riverside High School' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'riverside', description: 'Unique URL slug for the tenant' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with optional hyphens',
  })
  slug!: string;

  @ApiProperty({ enum: TENANT_PLANS, example: 'PRO' })
  @IsEnum(TENANT_PLANS)
  plan!: TenantPlan;

  @ApiPropertyOptional({ example: 'admin@riverside.educore.ai' })
  @IsOptional()
  @IsEmail()
  adminEmail?: string;
}
