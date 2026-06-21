import type { TenantPlan } from '@eduai365/shared-types';

export interface SchoolSummary {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  studentCount: number;
  logoUrl: string | null;
  isVerified: boolean;
}

export const DEFAULT_SCHOOL_SLUG = 'greenfield-university';

export const FALLBACK_SCHOOLS: SchoolSummary[] = [
  {
    id: 'fallback-greenfield',
    name: 'Greenfield University',
    slug: 'greenfield-university',
    plan: 'PRO',
    studentCount: 12400,
    logoUrl: null,
    isVerified: true,
  },
  {
    id: 'fallback-summit',
    name: 'Summit Institute of Technology',
    slug: 'summit-institute',
    plan: 'ENTERPRISE',
    studentCount: 31000,
    logoUrl: null,
    isVerified: true,
  },
  {
    id: 'fallback-st-judes',
    name: "St. Jude's Medical College",
    slug: 'st-judes-medical',
    plan: 'CORE',
    studentCount: 8500,
    logoUrl: null,
    isVerified: true,
  },
];

export async function fetchSchools(): Promise<SchoolSummary[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return FALLBACK_SCHOOLS;
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/schools`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return FALLBACK_SCHOOLS;
    }

    const payload = (await response.json()) as { success: boolean; data: SchoolSummary[] };

    if (!payload.success || !Array.isArray(payload.data) || payload.data.length === 0) {
      return FALLBACK_SCHOOLS;
    }

    return payload.data.slice(0, 3);
  } catch {
    return FALLBACK_SCHOOLS;
  }
}
