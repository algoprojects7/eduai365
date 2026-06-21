import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ListSubstitutionsQueryDto {
  @ApiPropertyOptional({ example: '2025-06-17' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class SubstitutionSuggestionsQueryDto {
  @ApiProperty()
  @IsString()
  absentTeacherId!: string;

  @ApiProperty({ example: '2025-06-17' })
  @IsDateString()
  date!: string;
}

export class AssignSubstitutionDto {
  @ApiProperty()
  @IsString()
  absentTeacherId!: string;

  @ApiProperty()
  @IsString()
  substituteTeacherId!: string;

  @ApiProperty()
  @IsString()
  classId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty({ example: '2025-06-17' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  period!: number;
}
