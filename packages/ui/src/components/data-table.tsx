import * as React from 'react';
import { cn } from '../lib/cn';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  className,
  emptyMessage = 'No records found',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bento-card py-12 text-center text-on-surface-variant">{emptyMessage}</div>
    );
  }

  return (
    <div className={cn('bento-card overflow-hidden p-0', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-300/20">
              {columns.map((col) => (
                <th key={col.key} className={cn('data-table-header px-4 py-3 text-left', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-b border-gray-300/10 transition-colors last:border-0 hover:bg-surface-faint/50"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-body-md', col.className)}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
