import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AiCopilotRole } from '@eduai365/shared-types';
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

const COPILOT_ROLES = [
  'PRINCIPAL',
  'TEACHER',
  'PARENT',
  'STUDENT',
  'SCHOOL_ADMIN',
  'VICE_PRINCIPAL',
] as const satisfies readonly AiCopilotRole[];

export class ChatCopilotDto {
  @ApiProperty({ enum: COPILOT_ROLES })
  @IsIn(COPILOT_ROLES)
  role!: AiCopilotRole;

  @ApiProperty({ example: 'What is the fee payment deadline this term?' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ description: 'Optional page or entity context for RAG' })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
