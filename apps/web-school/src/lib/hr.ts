import type { EmployeeProfile, SalaryBreakdown } from '@/types/hr';

export function parseDecimal(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

export function calculateNetSalary(
  basicSalary: number,
  hra: number,
  da: number,
  pfPercent: number,
  tdsPercent: number,
): SalaryBreakdown {
  const gross = basicSalary + hra + da;
  const pf = Math.round(gross * (pfPercent / 100) * 100) / 100;
  const tds = Math.round(gross * (tdsPercent / 100) * 100) / 100;
  const net = Math.round((gross - pf - tds) * 100) / 100;
  return { gross, pf, tds, net };
}

export function employeeFullName(profile: EmployeeProfile): string {
  return `${profile.user.firstName} ${profile.user.lastName}`.trim();
}

export function getContractExpiryDate(joinDate: string): Date {
  const expiry = new Date(joinDate);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
}

export function isContractExpiringSoon(profile: EmployeeProfile, withinDays = 30): boolean {
  if (profile.employmentType !== 'CONTRACT') return false;
  const now = new Date();
  const expiry = getContractExpiryDate(profile.joinDate);
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() + withinDays);
  return expiry >= now && expiry <= threshold;
}

export function formatEmployeeStatus(profile: EmployeeProfile): 'active' | 'inactive' {
  return profile.user.isActive ? 'active' : 'inactive';
}
