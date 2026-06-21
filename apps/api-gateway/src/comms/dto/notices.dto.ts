import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { NoticeCategory } from '@eduai365/database';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

const NOTICE_CATEGORIES = [
  'ACADEMIC',
  'SPORTS',
  'HOLIDAY',
  'EXAM',
  'GENERAL',
] as const satisfies readonly NoticeCategory[];

export class ListNoticesQueryDto {
  @ApiPropertyOptional({ enum: NOTICE_CATEGORIES })
  @IsOptional()
  @IsIn(NOTICE_CATEGORIES)
  category?: NoticeCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  publishedOnly?: boolean;
}

export class CreateNoticeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiProperty({ enum: NOTICE_CATEGORIES })
  @IsIn(NOTICE_CATEGORIES)
  category!: NoticeCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateNoticeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ enum: NOTICE_CATEGORIES })
  @IsOptional()
  @IsIn(NOTICE_CATEGORIES)
  category?: NoticeCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}
