import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import type { CalendarEventType } from '@eduai365/database';

const CALENDAR_EVENT_TYPES: CalendarEventType[] = [
  'EXAM',
  'HOLIDAY',
  'EVENT',
  'PTM',
  'SPORTS',
];

export class CalendarEventsQueryDto {
  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  month!: number;

  @ApiProperty({ example: 2025 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year!: number;
}

export class CreateCalendarEventDto {
  @ApiProperty({ example: 'Annual Sports Day' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ enum: CALENDAR_EVENT_TYPES })
  @IsEnum(CALENDAR_EVENT_TYPES)
  type!: CalendarEventType;

  @ApiProperty({ example: '2025-11-20T08:00:00.000Z' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2025-11-20T17:00:00.000Z' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];
}

export class UpdateCalendarEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({ enum: CALENDAR_EVENT_TYPES })
  @IsOptional()
  @IsEnum(CALENDAR_EVENT_TYPES)
  type?: CalendarEventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];
}
