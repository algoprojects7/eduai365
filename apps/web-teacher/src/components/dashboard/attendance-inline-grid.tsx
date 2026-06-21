'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@eduai365/ui';
import { apiFetch } from '@/lib/api';
import { todayIsoDate } from '@/lib/format';
import type { AttendanceRecord, AttendanceStatus, TeacherClass } from '@/types/teacher';

interface AttendanceInlineGridProps {
  classes: TeacherClass[];
  defaultClassId?: string;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; activeClass: string }[] = [
  { value: 'PRESENT', label: 'Present', activeClass: 'bg-success text-white' },
  { value: 'ABSENT', label: 'Absent', activeClass: 'bg-error text-white' },
  { value: 'LATE', label: 'Late', activeClass: 'bg-warning text-white' },
];

export function AttendanceInlineGrid({ classes, defaultClassId }: AttendanceInlineGridProps) {
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId ?? classes[0]?.id ?? '');
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = useCallback(async (classId: string) => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AttendanceRecord>(
        `/teacher/attendance?classId=${encodeURIComponent(classId)}&date=${todayIsoDate()}`,
      );
      setRecord(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      void loadAttendance(selectedClassId);
    }
  }, [selectedClassId, loadAttendance]);

  async function updateStatus(studentId: string, status: AttendanceStatus) {
    if (!record || !selectedClassId) return;

    setRecord((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        students: prev.students.map((s) =>
          s.studentId === studentId ? { ...s, status } : s,
        ),
      };
    });

    setSaving(true);
    try {
      const updated = await apiFetch<AttendanceRecord>('/teacher/attendance', {
        method: 'PATCH',
        body: JSON.stringify({
          classId: selectedClassId,
          date: todayIsoDate(),
          updates: [{ studentId, status }],
        }),
      });
      setRecord(updated);
    } catch {
      void loadAttendance(selectedClassId);
    } finally {
      setSaving(false);
    }
  }

  if (classes.length === 0) {
    return (
      <div className="bento-card py-8 text-center text-on-surface-variant">
        No classes available for attendance.
      </div>
    );
  }

  return (
    <div className="bento-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-title-lg font-semibold text-on-surface">Today&apos;s Attendance</h3>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="h-10 rounded-lg border border-gray-300/30 bg-surface-faint px-3 text-body-md outline-none focus:border-secondary"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} {cls.section} — {cls.subject}
            </option>
          ))}
        </select>
      </div>

      {record?.summary && (
        <div className="flex flex-wrap gap-4 text-body-md">
          <span className="text-success">Present: {record.summary.present}</span>
          <span className="text-error">Absent: {record.summary.absent}</span>
          <span className="text-warning">Late: {record.summary.late}</span>
          {saving && <span className="text-on-surface-variant">Saving…</span>}
        </div>
      )}

      {loading && (
        <p className="py-8 text-center text-on-surface-variant">Loading attendance…</p>
      )}

      {error && !loading && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
      )}

      {!loading && record && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300/20">
                <th className="px-3 py-2 text-left text-label-md text-on-surface-variant">Roll</th>
                <th className="px-3 py-2 text-left text-label-md text-on-surface-variant">Student</th>
                <th className="px-3 py-2 text-left text-label-md text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody>
              {record.students.map((student) => (
                <tr key={student.studentId} className="border-b border-gray-300/10 last:border-0">
                  <td className="px-3 py-3 text-body-md tabular-nums">{student.rollNo}</td>
                  <td className="px-3 py-3 text-body-md">{student.name}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {STATUS_OPTIONS.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={saving}
                          className={
                            student.status === opt.value
                              ? opt.activeClass
                              : 'border border-gray-300/30'
                          }
                          onClick={() => void updateStatus(student.studentId, opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
