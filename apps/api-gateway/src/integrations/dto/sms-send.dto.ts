import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class SmsSendDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @MinLength(8)
  to!: string;

  @ApiProperty({ example: 'Fee reminder: Term 2 due by 30 Sep.' })
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiPropertyOptional({ enum: ['msg91', 'twilio'], default: 'msg91' })
  @IsOptional()
  @IsIn(['msg91', 'twilio'])
  provider?: 'msg91' | 'twilio';
}
