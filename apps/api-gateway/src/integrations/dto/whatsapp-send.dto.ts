import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class WhatsappSendDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @MinLength(8)
  to!: string;

  @ApiProperty({ example: 'Your ward boarded the school bus at 7:45 AM.' })
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiPropertyOptional({ example: 'educore_bus_alert' })
  @IsOptional()
  @IsString()
  templateId?: string;
}
