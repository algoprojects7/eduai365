import type { UserRole } from '@eduai365/shared-types';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bus,
  GraduationCap,
  IdCard,
  Shield,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';

export interface RoleCardConfig {
  title: string;
  role: UserRole;
  description: string;
  icon: LucideIcon;
  variant: 'default' | 'dark' | 'purple';
  className?: string;
}

export const ROLE_CARDS: RoleCardConfig[] = [
  {
    title: 'Super Admin',
    role: 'SUPER_ADMIN',
    description: 'Manage multi-school operations, subscriptions, and platform-wide settings.',
    icon: Shield,
    variant: 'dark',
    className: 'md:row-span-2',
  },
  {
    title: 'Principal',
    role: 'PRINCIPAL',
    description: 'Oversee school performance, staff, and strategic initiatives.',
    icon: GraduationCap,
    variant: 'default',
  },
  {
    title: 'Teacher',
    role: 'TEACHER',
    description: 'Plan lessons, track attendance, and manage student assessments.',
    icon: BookOpen,
    variant: 'default',
  },
  {
    title: 'Student',
    role: 'STUDENT',
    description: 'Access timetables, assignments, grades, and learning resources.',
    icon: Users,
    variant: 'default',
  },
  {
    title: 'Parent',
    role: 'PARENT',
    description: 'Monitor progress, pay fees, and stay connected with teachers.',
    icon: UserCheck,
    variant: 'default',
  },
  {
    title: 'HR Admin',
    role: 'HR_MANAGER',
    description: 'Manage staff records, payroll, leave, and recruitment workflows.',
    icon: IdCard,
    variant: 'purple',
    className: 'md:col-span-2',
  },
  {
    title: 'Librarian',
    role: 'LIBRARIAN',
    description: 'Catalog books, manage issues, and track library inventory.',
    icon: BookOpen,
    variant: 'default',
  },
  {
    title: 'Transport Manager',
    role: 'TRANSPORT_MANAGER',
    description: 'Manage fleet routes, drivers, student allocation, and GPS tracking.',
    icon: Bus,
    variant: 'default',
  },
  {
    title: 'Admission Officer',
    role: 'RECEPTIONIST',
    description: 'Process applications, enrollments, and student onboarding.',
    icon: BadgeCheck,
    variant: 'default',
  },
  {
    title: 'Club Manager',
    role: 'CLUB_MANAGER' as any,
    description: 'Coordinate student clubs, extracurricular events, and activities.',
    icon: Trophy,
    variant: 'default',
  },
];

const SCHOOL_URL = process.env.NEXT_PUBLIC_SCHOOL_URL ?? 'http://localhost:3002';

const ROLE_PORTAL_URLS: Partial<Record<UserRole, string>> = {
  PRINCIPAL: SCHOOL_URL,
  HR_MANAGER: SCHOOL_URL,
  LIBRARIAN: SCHOOL_URL,
  TRANSPORT_MANAGER: SCHOOL_URL,
  TEACHER: process.env.NEXT_PUBLIC_TEACHER_URL ?? 'http://localhost:3003',
  STUDENT: process.env.NEXT_PUBLIC_STUDENT_URL ?? 'http://localhost:3004',
  PARENT: process.env.NEXT_PUBLIC_PARENT_URL ?? 'http://localhost:3005',
};

const ROLE_LOGIN_REDIRECTS: Partial<Record<UserRole, string>> = {
  LIBRARIAN: '/operations/library',
  TRANSPORT_MANAGER: '/operations/transport',
};

export function buildLoginUrl(role: UserRole, schoolSlug: string): string {
  if (role === 'SUPER_ADMIN') {
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001';
    return `${adminUrl}/login`;
  }
  const portalUrl = ROLE_PORTAL_URLS[role] ?? SCHOOL_URL;
  const redirect = ROLE_LOGIN_REDIRECTS[role];
  const redirectParam = redirect ? `&redirect=${encodeURIComponent(redirect)}` : '';
  return `${portalUrl}/login?role=${role}&school=${schoolSlug}${redirectParam}`;
}

export { ArrowRight };
