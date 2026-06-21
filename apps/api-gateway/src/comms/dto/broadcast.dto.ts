import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DeliveryChannel } from '@eduai365/database';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AudienceFilterDto } from './circulars.dto';

const DELIVERY_CHANNELS = [
  'EMAIL',
  'SMS',
  'WHATSAPP',
  'PUSH',
  'IN_APP',
] as const satisfies readonly DeliveryChannel[];

export class CreateBroadcastDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({ enum: DELIVERY_CHANNELS, isArray: true })
  @IsArray()
  @IsIn(DELIVERY_CHANNELS, { each: true })
  channels!: DeliveryChannel[];

  @ApiProperty({ type: AudienceFilterDto })
  @ValidateNested()
  @Type(() => AudienceFilterDto)
  audienceFilter!: AudienceFilterDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
