import { ApiProperty } from '@nestjs/swagger';
import type { AiCopilotRole } from '@eduai365/shared-types';
import { IsIn } from 'class-validator';

const INSIGHT_ROLES = [
  'PRINCIPAL',
  'TEACHER',
  'PARENT',
  'SCHOOL_ADMIN',
  'VICE_PRINCIPAL',
] as const satisfies readonly AiCopilotRole[];

export class DashboardInsightsQueryDto {
  @ApiProperty({ enum: INSIGHT_ROLES })
  @IsIn(INSIGHT_ROLES)
  role!: AiCopilotRole;
}
