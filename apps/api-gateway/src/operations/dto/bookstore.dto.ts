import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBookstoreItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  classGrade!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rackNo?: string;
}

export class IssueBookstoreItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textbookId?: string;
}

export class ReturnBookstoreItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  issueId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  damageFine?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condition?: string;
}

export class RecordDamageFineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  issueId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  damageType!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fineAmount!: number;
}
