import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateHostelBlockDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class UpdateHostelBlockDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;
}

export class CreateHostelRoomDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roomNumber!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;
}

export class UpdateHostelRoomDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;
}

export class AssignHostelResidentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @ApiProperty()
  @IsDateString()
  checkIn!: string;
}

export class CheckoutHostelResidentDto {
  @ApiProperty()
  @IsDateString()
  checkOut!: string;
}

export class ListHostelResidentsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  blockId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activeOnly?: string;
}

export class CreateVisitorLogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  visitorName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  relation!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  purpose!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idProof?: string;
}

export class AllocateRoomDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;
}
