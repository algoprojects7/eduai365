import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

const COMPLAINT_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'RESOLVED'] as const;

export class ListComplaintsQueryDto {
  @ApiPropertyOptional({ enum: COMPLAINT_STATUSES })
  @IsOptional()
  @IsIn(COMPLAINT_STATUSES)
  status?: (typeof COMPLAINT_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mine?: string;
}

export class CreateComplaintDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class CreateComplaintMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body!: string;
}
