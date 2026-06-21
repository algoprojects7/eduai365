'use client';

import { useEffect, useState } from 'react';
import { Button } from '@eduai365/ui';
import { X } from 'lucide-react';
import type { CreateLeaveInput, LeaveType } from '@/types/hr';
import { LEAVE_TYPES, LEAVE_TYPE_LABELS } from '@/types/hr';

interface ApplyLeaveModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateLeaveInput) => Promise<void>;
}

const EMPTY_FORM: CreateLeaveInput = {
  type: 'CL',
  startDate: '',
  endDate: '',
  reason: '',
};

export function ApplyLeaveModal({ open, onClose, onSubmit }: ApplyLeaveModalProps) {
  const [form, setForm] = useState<CreateLeaveInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-panel-dark w-full max-w-md rounded-lg border border-white/10 p-6 shadow-ai-glow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-title-lg font-semibold text-white">Apply for Leave</h2>
            <p className="mt-1 text-body-md text-white/50">Submit a new leave request for approval</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-label-md text-white/60">Leave Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as LeaveType }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-body-md text-white outline-none focus:border-secondary"
            >
              {LEAVE_TYPES.map((type) => (
                <option key={type} value={type} className="bg-cinematic-dark">
                  {LEAVE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-label-md text-white/60">Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-body-md text-white outline-none focus:border-secondary"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-white/60">End Date</label>
              <input
                type="date"
                required
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-body-md text-white outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-label-md text-white/60">Reason</label>
            <textarea
              required
              rows={3}
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Brief reason for leave…"
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-body-md text-white placeholder:text-white/30 outline-none focus:border-secondary"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="ai" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
