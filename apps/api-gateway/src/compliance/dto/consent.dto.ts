import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class RecordConsentDto {
  @ApiPropertyOptional({ description: 'Consent to process personal data for service delivery' })
  @IsOptional()
  @IsBoolean()
  dataProcessing?: boolean;

  @ApiPropertyOptional({ description: 'Consent to receive marketing communications' })
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;

  @ApiPropertyOptional({ description: 'Consent to analytics and product improvement tracking' })
  @IsOptional()
  @IsBoolean()
  analytics?: boolean;

  @ApiPropertyOptional({ description: 'Consent to SMS, email, and push notifications' })
  @IsOptional()
  @IsBoolean()
  communications?: boolean;

  @ApiPropertyOptional({ description: 'Consent to share data with approved third parties' })
  @IsOptional()
  @IsBoolean()
  thirdPartySharing?: boolean;
}
