export const urls = {
  landing: process.env.LANDING_URL ?? 'http://localhost:3000',
  admin: process.env.ADMIN_URL ?? 'http://localhost:3001',
  school: process.env.SCHOOL_URL ?? 'http://localhost:3002',
  teacher: process.env.TEACHER_URL ?? 'http://localhost:3003',
  student: process.env.STUDENT_URL ?? 'http://localhost:3004',
  parent: process.env.PARENT_URL ?? 'http://localhost:3005',
  api: process.env.API_URL ?? 'http://localhost:4000',
} as const;

export const demoCredentials = {
  schoolSlug: process.env.E2E_SCHOOL_SLUG ?? 'greenfield',
  password: process.env.E2E_PASSWORD ?? 'AlgoDemo#2026',
  principal: process.env.E2E_PRINCIPAL_EMAIL ?? 'principal@greenfield.eduai365.ai',
  teacher: process.env.E2E_TEACHER_EMAIL ?? 'teacher@greenfield.eduai365.ai',
  parent: process.env.E2E_PARENT_EMAIL ?? 'parent@greenfield.eduai365.ai',
} as const;
