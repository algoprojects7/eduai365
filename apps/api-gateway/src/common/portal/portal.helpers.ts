import type { Prisma } from '@eduai365/database';

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value);
}

export function mockAttendancePercent(studentId: string): number {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash + studentId.charCodeAt(i) * (i + 1)) % 100;
  }
  return 82 + (hash % 15);
}

export function mockDailyAttendanceStatus(
  studentId: string,
  date: string,
): 'PRESENT' | 'ABSENT' | 'LATE' {
  let hash = 0;
  const key = `${studentId}:${date}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i) * (i + 1)) % 100;
  }
  const mod = hash % 10;
  if (mod === 0) return 'ABSENT';
  if (mod === 1) return 'LATE';
  return 'PRESENT';
}

export function computeGrade(marks: number, maxMarks: number): string {
  const pct = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

export function getTodayDayOfWeek(): number {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

export function parseDateOnly(value: string): Date {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

export function endOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0, 23, 59, 59, 999);
}

export function gpaFromPercentage(percentage: number): number {
  return Math.round((percentage / 25) * 100) / 100;
}
