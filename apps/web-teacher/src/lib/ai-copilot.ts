import type { AiCopilotRole, UserRole } from '@eduai365/shared-types';

const COPILOT_ROLES: readonly AiCopilotRole[] = [
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'SCHOOL_ADMIN',
  'TEACHER',
  'STUDENT',
  'PARENT',
];

export function resolveCopilotRole(role: UserRole | undefined, fallback: AiCopilotRole): AiCopilotRole {
  if (role && COPILOT_ROLES.includes(role as AiCopilotRole)) {
    return role as AiCopilotRole;
  }
  return fallback;
}
