'use client';

import { DataTable } from '@eduai365/ui';
import type { Gradebook } from '@/types/teacher';

interface GradebookPreviewProps {
  gradebook: Gradebook | null;
}

export function GradebookPreview({ gradebook }: GradebookPreviewProps) {
  if (!gradebook || gradebook.entries.length === 0) {
    return (
      <div className="bento-card py-8 text-center text-on-surface-variant">
        No gradebook data available.
      </div>
    );
  }

  const previewColumns = gradebook.columns.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-title-lg font-semibold text-on-surface">Gradebook Preview</h3>
        <span className="text-body-md text-on-surface-variant">{gradebook.className}</span>
      </div>
      <DataTable
        columns={[
          { key: 'rollNo', header: 'Roll', className: 'w-16' },
          { key: 'studentName', header: 'Student' },
          ...previewColumns.map((col) => ({
            key: col.id,
            header: col.name,
            render: (row: (typeof gradebook.entries)[0]) => {
              const score = row.scores[col.id];
              return score !== null && score !== undefined ? String(score) : '—';
            },
          })),
          {
            key: 'average',
            header: 'Avg',
            render: (row) => (
              <span className="font-semibold text-secondary">{row.average.toFixed(1)}</span>
            ),
          },
        ]}
        data={gradebook.entries.slice(0, 5)}
        keyExtractor={(row) => row.studentId}
        emptyMessage="No grades recorded"
      />
    </div>
  );
}
