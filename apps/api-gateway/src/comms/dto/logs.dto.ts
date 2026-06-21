import { ApiPropertyOptional } from '@nestjs/swagger';
import type { DeliveryChannel, DeliveryStatus } from '@eduai365/database';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

const DELIVERY_CHANNELS = [
  'EMAIL',
  'SMS',
  'WHATSAPP',
  'PUSH',
  'IN_APP',
] as const satisfies readonly DeliveryChannel[];

const DELIVERY_STATUSES = [
  'PENDING',
  'QUEUED',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
] as const satisfies readonly DeliveryStatus[];

export class ListLogsQueryDto {
  @ApiPropertyOptional({ enum: DELIVERY_CHANNELS })
  @IsOptional()
  @IsIn(DELIVERY_CHANNELS)
  channel?: DeliveryChannel;

  @ApiPropertyOptional({ enum: DELIVERY_STATUSES })
  @IsOptional()
  @IsIn(DELIVERY_STATUSES)
  status?: DeliveryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}
