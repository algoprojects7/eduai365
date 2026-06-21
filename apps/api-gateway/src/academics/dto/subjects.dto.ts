import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class SubjectItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  maxMarks!: number;
}

export class CreateSubjectsBatchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  session!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  className!: string;

  @ApiProperty({ enum: ['en', 'as'] })
  @IsString()
  language!: string;

  @ApiProperty({ type: [SubjectItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectItemDto)
  subjects!: SubjectItemDto[];
}

export class UpdateSubjectDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxMarks?: number;
}
