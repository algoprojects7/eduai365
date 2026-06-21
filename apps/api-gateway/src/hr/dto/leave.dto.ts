import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class ListLeaveQueryDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED'])
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export class LeaveBalancesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class LeaveCalendarQueryDto {
  @ApiPropertyOptional({ example: '2025-06' })
  @IsOptional()
  @IsString()
  month?: string;
}

export class ApplyLeaveDto {
  @ApiProperty()
  @IsString()
  employeeId!: string;

  @ApiProperty({ enum: ['CL', 'SL', 'EL', 'ML', 'PL'] })
  @IsEnum(['CL', 'SL', 'EL', 'ML', 'PL'])
  type!: 'CL' | 'SL' | 'EL' | 'ML' | 'PL';

  @ApiProperty({ example: '2025-06-20' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2025-06-22' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  days!: number;

  @ApiProperty({ example: 'Family function' })
  @IsString()
  @MinLength(1)
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  substituteId?: string;
}

export class UpdateLeaveDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  substituteId?: string;
}
