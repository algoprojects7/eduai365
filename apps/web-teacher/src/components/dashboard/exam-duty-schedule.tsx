'use client';

import { Calendar, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { ExamDuty } from '@/types/teacher';

interface ExamDutyScheduleProps {
  duties: ExamDuty[];
}

export function ExamDutySchedule({ duties }: ExamDutyScheduleProps) {
  if (duties.length === 0) {
    return (
      <div className="bento-card py-8 text-center text-on-surface-variant">
        No upcoming exam duties scheduled.
      </div>
    );
  }

  return (
    <div className="bento-card space-y-3">
      <h3 className="text-title-lg font-semibold text-on-surface">Exam Duty Schedule</h3>
      <ul className="space-y-3">
        {duties.map((duty) => (
          <li
            key={duty.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-300/20 bg-surface-faint/50 p-3"
          >
            <div>
              <p className="font-semibold text-on-surface">{duty.examName}</p>
              <p className="text-body-md text-on-surface-variant">{duty.role}</p>
            </div>
            <div className="space-y-1 text-right text-body-md text-on-surface-variant">
              <p className="flex items-center justify-end gap-1">
                <Calendar className="h-4 w-4" strokeWidth={1.5} />
                {formatDate(duty.date)} · {duty.time}
              </p>
              <p className="flex items-center justify-end gap-1">
                <MapPin className="h-4 w-4" strokeWidth={1.5} />
                {duty.room}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
