'use client';

import { Badge, Button, DataTable } from '@eduai365/ui';
import { Bell } from 'lucide-react';
import type { OverdueInvoice } from '@/types/finance';

interface OverdueTableProps {
  rows: OverdueInvoice[];
  onSendReminder: (invoiceId: string, studentName: string) => void;
}

function formatRupee(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function DefaultRiskBadge({ score }: { score: number }) {
  const isHigh = score > 70;
  return (
    <Badge variant={isHigh ? 'error' : score > 40 ? 'warning' : 'success'}>
      AI Risk {score}%
    </Badge>
  );
}

export function OverdueTable({ rows, onSendReminder }: OverdueTableProps) {
  return (
    <DataTable
      data={rows}
      keyExtractor={(row) => row.invoiceId}
      emptyMessage="No overdue invoices"
      columns={[
        {
          key: 'studentName',
          header: 'Student',
          render: (row) => (
            <span className="font-medium text-on-surface">{row.studentName}</span>
          ),
        },
        {
          key: 'class',
          header: 'Class',
          render: (row) => row.class,
        },
        {
          key: 'amount',
          header: 'Amount',
          render: (row) => formatRupee(row.amount),
        },
        {
          key: 'dueDate',
          header: 'Due Date',
          render: (row) => formatDate(row.dueDate),
        },
        {
          key: 'daysOverdue',
          header: 'Days Overdue',
          render: (row) => (
            <span className={row.daysOverdue > 30 ? 'font-semibold text-error' : ''}>
              {row.daysOverdue}
            </span>
          ),
        },
        {
          key: 'defaultRiskScore',
          header: 'Default Risk',
          render: (row) => <DefaultRiskBadge score={row.defaultRiskScore} />,
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (row) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSendReminder(row.invoiceId, row.studentName)}
            >
              <Bell className="mr-1.5 h-4 w-4" />
              Send Reminder
            </Button>
          ),
        },
      ]}
    />
  );
}
