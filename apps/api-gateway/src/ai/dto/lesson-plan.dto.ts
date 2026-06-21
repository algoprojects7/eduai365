import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GenerateLessonPlanDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: 'Fractions and decimals' })
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @ApiProperty({ example: 'Grade 6' })
  @IsString()
  @IsNotEmpty()
  grade!: string;

  @ApiProperty({ example: 45 })
  @IsInt()
  @Min(15)
  @Max(180)
  durationMinutes!: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  standards?: string[];
}
