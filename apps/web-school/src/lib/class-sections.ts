import type { ClassSectionOption } from '@/types/academics';
import type { StudentRow } from '@/types/school';

const FALLBACK_CLASS_SECTIONS: ClassSectionOption[] = [
  { classId: 'cls-nursery', sectionId: 'sec-a', grade: 'Nursery', section: 'A', label: 'Nursery A' },
  { classId: 'cls-1', sectionId: 'sec-a', grade: 'Class 1', section: 'A', label: 'Class 1 A' },
  { classId: 'cls-6', sectionId: 'sec-b', grade: 'Class 6', section: 'B', label: 'Class 6 B' },
  { classId: 'cls-8', sectionId: 'sec-a', grade: 'Class 8', section: 'A', label: 'Class 8 A' },
  { classId: 'cls-10', sectionId: 'sec-c', grade: 'Class 10', section: 'C', label: 'Class 10 C' },
  { classId: 'cls-12', sectionId: 'sec-a', grade: 'Class 12', section: 'A', label: 'Class 12 A' },
];

function studentClassLabel(row: StudentRow): string {
  if (typeof row.class === 'string') return row.class;
  if (row.className) return row.className;
  if (row.class && typeof row.class === 'object' && row.class.name) return row.class.name;
  return '';
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseClassSection(label: string): { grade: string; section: string } | null {
  const trimmed = label.trim();
  if (!trimmed || trimmed === '—') return null;

  const match = trimmed.match(/^(.+?)\s*([A-Za-z])$/);
  if (match?.[1] && match[2]) {
    return { grade: match[1].trim(), section: match[2].toUpperCase() };
  }

  return { grade: trimmed, section: 'A' };
}

export function deriveClassSectionsFromStudents(students: StudentRow[]): ClassSectionOption[] {
  const map = new Map<string, ClassSectionOption>();

  for (const student of students) {
    const label = studentClassLabel(student);
    const parsed = parseClassSection(label);
    if (!parsed) continue;

    const key = `${parsed.grade}-${parsed.section}`;
    if (map.has(key)) continue;

    map.set(key, {
      classId: `cls-${slugify(parsed.grade)}`,
      sectionId: `sec-${parsed.section.toLowerCase()}`,
      grade: parsed.grade,
      section: parsed.section,
      label: `${parsed.grade} ${parsed.section}`,
    });
  }

  const derived = Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  return derived.length > 0 ? derived : FALLBACK_CLASS_SECTIONS;
}

export function getFallbackClassSections(): ClassSectionOption[] {
  return FALLBACK_CLASS_SECTIONS;
}
