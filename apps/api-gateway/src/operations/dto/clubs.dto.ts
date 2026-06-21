import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateClubDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  advisorId?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxMembers!: number;
}

export class JoinClubDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;
}
