'use client';

import { useState } from 'react';
import { DataTable, StatusBadge, Badge, buttonVariants, cn } from '@eduai365/ui';
import { Trash2, AlertTriangle, ShieldAlert, CheckCircle, RefreshCcw, Power, X } from 'lucide-react';
import type { SchoolRow } from '@/types/platform';

interface SchoolsTableProps {
  schools: SchoolRow[];
  onSuspend: (id: string, currentStatus: string) => void;
  onRemove: (id: string) => void;
}

function mapStatus(status: string): 'active' | 'pending' | 'inactive' | 'warning' {
  switch (status.toLowerCase()) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'warning';
    case 'inactive':
    case 'suspended':
      return 'inactive';
    default:
      return 'pending';
  }
}

export function SchoolsTable({ schools, onSuspend, onRemove }: SchoolsTableProps) {
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'activate' | 'remove';
    school: SchoolRow;
  } | null>(null);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'remove') {
      onRemove(confirmAction.school.id);
    } else {
      onSuspend(confirmAction.school.id, confirmAction.school.status);
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-title-lg font-semibold text-on-surface">School Tenants</h3>
        <p className="text-body-md text-on-surface-variant">
          Plan, enrollment, and operational status across all ecosystems
        </p>
      </div>

      <DataTable
        data={schools}
        keyExtractor={(row) => row.id}
        columns={[
          {
            key: 'name',
            header: 'School',
            render: (row) => (
              <div>
                <p className="font-medium text-on-surface">{row.name}</p>
                <p className="text-label-md text-on-surface-variant">{row.slug}</p>
              </div>
            ),
          },
          {
            key: 'plan',
            header: 'Plan',
            render: (row) => (
              <Badge variant="info" className="uppercase">
                {row.plan}
              </Badge>
            ),
          },
          {
            key: 'studentCount',
            header: 'Students',
            render: (row) => row.studentCount.toLocaleString(),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <StatusBadge status={mapStatus(row.status)} />,
          },
          {
            key: 'actions',
            header: 'System Actions',
            render: (row) => {
              const isSuspended = row.status.toLowerCase() === 'inactive' || row.status.toLowerCase() === 'suspended';
              return (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        type: isSuspended ? 'activate' : 'suspend',
                        school: row,
                      })
                    }
                    title={isSuspended ? 'Reactivate school' : 'Suspend school'}
                    className={cn(
                      'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
                      isSuspended
                        ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                    )}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        type: 'remove',
                        school: row,
                      })
                    }
                    title="Remove school tenant"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            },
          },
        ]}
        emptyMessage="No school tenants onboarded yet"
      />

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100 animate-in-fade">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="absolute right-4 top-4 text-on-surface-variant/40 hover:text-on-surface"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex gap-4">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                  confirmAction.type === 'suspend' && 'bg-amber-100 text-amber-600',
                  confirmAction.type === 'activate' && 'bg-emerald-100 text-emerald-600',
                  confirmAction.type === 'remove' && 'bg-red-100 text-red-600'
                )}
              >
                {confirmAction.type === 'suspend' && <ShieldAlert className="h-6 w-6" />}
                {confirmAction.type === 'activate' && <CheckCircle className="h-6 w-6" />}
                {confirmAction.type === 'remove' && <AlertTriangle className="h-6 w-6" />}
              </div>

              <div className="space-y-2">
                <h4 className="text-body-lg font-bold text-on-surface">
                  {confirmAction.type === 'suspend' && 'Suspend School Tenant?'}
                  {confirmAction.type === 'activate' && 'Activate School Tenant?'}
                  {confirmAction.type === 'remove' && 'Permanently Delete Tenant?'}
                </h4>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {confirmAction.type === 'suspend' && (
                    <>
                      Are you sure you want to suspend <strong>{confirmAction.school.name}</strong>? This will block login access for all users in this school immediately.
                    </>
                  )}
                  {confirmAction.type === 'activate' && (
                    <>
                      Are you sure you want to reactivate <strong>{confirmAction.school.name}</strong>? This will restore complete access to all school portals.
                    </>
                  )}
                  {confirmAction.type === 'remove' && (
                    <>
                      Warning: Are you sure you want to permanently remove <strong>{confirmAction.school.name}</strong>? This action is irreversible and deletes all associated student, academic, and financial data.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className={cn(buttonVariants({ variant: 'ghost', size: 'md' }), 'px-5')}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={cn(
                  'rounded-lg px-5 py-2.5 text-body-md font-semibold text-white transition-all shadow-sm',
                  confirmAction.type === 'suspend' && 'bg-amber-600 hover:bg-amber-700',
                  confirmAction.type === 'activate' && 'bg-emerald-600 hover:bg-emerald-700',
                  confirmAction.type === 'remove' && 'bg-red-600 hover:bg-red-700'
                )}
              >
                {confirmAction.type === 'suspend' && 'Yes, Suspend'}
                {confirmAction.type === 'activate' && 'Yes, Activate'}
                {confirmAction.type === 'remove' && 'Yes, Remove Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
