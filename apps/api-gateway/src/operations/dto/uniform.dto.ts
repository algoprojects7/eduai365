import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateUniformStockDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  stock!: number;
}

export class UniformOrderLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateUniformOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ type: [UniformOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UniformOrderLineDto)
  items!: UniformOrderLineDto[];
}

export class ListUniformOrdersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;
}
