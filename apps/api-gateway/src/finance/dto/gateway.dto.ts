import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateGatewayConfigDto {
  @ApiPropertyOptional({ example: 'razorpay' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  provider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTestMode?: boolean;

  @ApiPropertyOptional({ description: 'Provider credentials (stored as encryptedConfig placeholder)' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
