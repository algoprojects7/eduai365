'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, DataTable } from '@eduai365/ui';
import {
  ArrowLeft,
  Camera,
  Check,
  Copy,
  MessageSquare,
  QrCode,
  RefreshCw,
  Send,
  Webhook,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import type {
  PaymentWebhookEndpoint,
  QrAttendanceResult,
  TestMessageInput,
  TestMessageResult,
  WebhookEventLog,
  WebhookEventStatus,
} from '@/types/integrations';
import { WEBHOOK_PROVIDER_LABELS, WEBHOOK_STATUS_LABELS } from '@/types/integrations';

const EMPTY_SMS: TestMessageInput = {
  to: '+91',
  message: 'EduCore test SMS — your school fee reminder is configured correctly.',
};

const EMPTY_WHATSAPP: TestMessageInput = {
  to: '+91',
  message: 'EduCore test WhatsApp — attendance marked successfully for demo student.',
};

function webhookStatusVariant(
  status: WebhookEventStatus,
): 'success' | 'error' | 'warning' | 'default' {
  if (status === 'processed') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'ignored') return 'warning';
  return 'default';
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="ghost" onClick={() => void handleCopy()} className="shrink-0">
      {copied ? <Check className="mr-2 h-4 w-4 text-success" /> : <Copy className="mr-2 h-4 w-4" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

export default function IntegrationsSettingsPage() {
  const [webhooks, setWebhooks] = useState<PaymentWebhookEndpoint[]>([]);
  const [logs, setLogs] = useState<WebhookEventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingLogs, setRefreshingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentId, setStudentId] = useState('');
  const [qrScanning, setQrScanning] = useState(false);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState<QrAttendanceResult | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [smsForm, setSmsForm] = useState<TestMessageInput>(EMPTY_SMS);
  const [whatsappForm, setWhatsappForm] = useState<TestMessageInput>(EMPTY_WHATSAPP);
  const [smsSubmitting, setSmsSubmitting] = useState(false);
  const [whatsappSubmitting, setWhatsappSubmitting] = useState(false);
  const [smsResult, setSmsResult] = useState<TestMessageResult | null>(null);
  const [whatsappResult, setWhatsappResult] = useState<TestMessageResult | null>(null);
  const [messagingError, setMessagingError] = useState<string | null>(null);

  const loadIntegrations = useCallback(async (logsOnly = false) => {
    if (logsOnly) {
      setRefreshingLogs(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const requests = logsOnly
        ? [apiFetch<WebhookEventLog[]>('/integrations/webhooks/logs')]
        : [
            apiFetch<PaymentWebhookEndpoint[]>('/integrations/webhooks'),
            apiFetch<WebhookEventLog[]>('/integrations/webhooks/logs'),
          ];

      const results = await Promise.all(requests);

      if (logsOnly) {
        setLogs(results[0] as WebhookEventLog[]);
      } else {
        const [endpointData, logData] = results as [
          PaymentWebhookEndpoint[],
          WebhookEventLog[],
        ];
        setWebhooks(endpointData);
        setLogs(logData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations data');
    } finally {
      setLoading(false);
      setRefreshingLogs(false);
    }
  }, []);

  useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  async function handleQrAttendance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = studentId.trim();
    if (!trimmed) return;

    setAttendanceSubmitting(true);
    setAttendanceError(null);
    setAttendanceResult(null);

    try {
      const data = await apiFetch<QrAttendanceResult>('/integrations/attendance/qr', {
        method: 'POST',
        body: JSON.stringify({
          studentId: trimmed,
          timestamp: new Date().toISOString(),
        }),
      });
      setAttendanceResult(data);
      setStudentId('');
    } catch (err) {
      setAttendanceError(err instanceof Error ? err.message : 'Failed to mark attendance');
    } finally {
      setAttendanceSubmitting(false);
    }
  }

  async function handleTestSms(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSmsSubmitting(true);
    setMessagingError(null);
    setSmsResult(null);

    try {
      const data = await apiFetch<TestMessageResult>('/integrations/sms/send', {
        method: 'POST',
        body: JSON.stringify(smsForm),
      });
      setSmsResult(data);
    } catch (err) {
      setMessagingError(err instanceof Error ? err.message : 'Failed to send test SMS');
    } finally {
      setSmsSubmitting(false);
    }
  }

  async function handleTestWhatsApp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWhatsappSubmitting(true);
    setMessagingError(null);
    setWhatsappResult(null);

    try {
      const data = await apiFetch<TestMessageResult>('/integrations/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify(whatsappForm),
      });
      setWhatsappResult(data);
    } catch (err) {
      setMessagingError(err instanceof Error ? err.message : 'Failed to send test WhatsApp message');
    } finally {
      setWhatsappSubmitting(false);
    }
  }

  const logColumns = useMemo(
    () => [
      {
        key: 'receivedAt',
        header: 'Received',
        render: (row: WebhookEventLog) => (
          <span className="text-on-surface-variant">{formatRelativeTime(row.receivedAt)}</span>
        ),
      },
      {
        key: 'provider',
        header: 'Gateway',
        render: (row: WebhookEventLog) => WEBHOOK_PROVIDER_LABELS[row.provider],
      },
      {
        key: 'eventType',
        header: 'Event',
        render: (row: WebhookEventLog) => (
          <span className="font-mono text-label-md">{row.eventType}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: WebhookEventLog) => (
          <Badge variant={webhookStatusVariant(row.status)}>{WEBHOOK_STATUS_LABELS[row.status]}</Badge>
        ),
      },
      {
        key: 'payloadSummary',
        header: 'Summary',
        render: (row: WebhookEventLog) => row.payloadSummary,
      },
    ],
    [],
  );

  return (
    <SchoolShell>
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <Link
            href="/settings"
            className="inline-flex items-center text-body-md text-secondary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Link>
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Integrations</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Payment webhooks, QR attendance, and messaging provider tests
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        <section className="bento-card space-y-4">
          <div className="flex items-start gap-3">
            <Webhook className="mt-0.5 h-5 w-5 text-secondary" />
            <div>
              <h2 className="text-title-md font-semibold text-on-surface">Payment Gateway Webhooks</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Copy these URLs into each provider dashboard to receive payment events securely.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-body-md text-on-surface-variant">Loading webhook URLs…</p>
          ) : (
            <div className="space-y-3">
              {webhooks.map((endpoint) => (
                <div
                  key={endpoint.provider}
                  className="rounded-lg border border-gray-300/20 bg-surface-faint/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-on-surface">{endpoint.label}</p>
                      <p className="text-label-md text-on-surface-variant">{endpoint.description}</p>
                    </div>
                    <CopyButton value={endpoint.url} />
                  </div>
                  <code className="mt-3 block overflow-x-auto rounded-md bg-surface px-3 py-2 font-mono text-label-md text-on-surface">
                    {endpoint.url}
                  </code>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bento-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-title-md font-semibold text-on-surface">Webhook Event Log</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Recent inbound payment webhook events (mock feed from API)
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => void loadIntegrations(true)}
              disabled={refreshingLogs || loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshingLogs ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <p className="text-body-md text-on-surface-variant">Loading event log…</p>
          ) : (
            <DataTable
              columns={logColumns}
              data={logs}
              keyExtractor={(row) => row.id}
              emptyMessage="No webhook events yet."
            />
          )}
        </section>

        <section className="bento-card space-y-5">
          <div className="flex items-start gap-3">
            <QrCode className="mt-0.5 h-5 w-5 text-secondary" />
            <div>
              <h2 className="text-title-md font-semibold text-on-surface">QR Attendance Scanner</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Scan a student QR code or enter an admission number manually.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300/40 bg-surface-faint">
                <div className="absolute inset-8 rounded-lg border-2 border-secondary/30" />
                <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                  <Camera className="h-10 w-10 text-on-surface-variant" />
                  <p className="text-body-md font-medium text-on-surface">Camera preview</p>
                  <p className="max-w-xs text-label-md text-on-surface-variant">
                    Live camera access will be enabled in production. Use manual entry below for now.
                  </p>
                  <Button
                    type="button"
                    variant={qrScanning ? 'primary' : 'ghost'}
                    onClick={() => setQrScanning((prev) => !prev)}
                  >
                    {qrScanning ? 'Simulating scan…' : 'Simulate QR scan'}
                  </Button>
                </div>
              </div>
            </div>

            <form onSubmit={handleQrAttendance} className="space-y-4">
              <div>
                <label
                  htmlFor="studentId"
                  className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                >
                  Student ID or admission number
                </label>
                <input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="STU-2024-0042"
                  className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 font-mono text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              {attendanceError && (
                <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">
                  {attendanceError}
                </div>
              )}

              {attendanceResult && (
                <div className="rounded-lg bg-success/10 px-4 py-3 text-body-md text-success">
                  <p className="font-medium">
                    {attendanceResult.studentName} marked {attendanceResult.status.toLowerCase()}
                  </p>
                  <p className="mt-1 text-label-md">
                    {attendanceResult.admissionNo} · {attendanceResult.date}
                  </p>
                </div>
              )}

              <Button type="submit" variant="primary" disabled={attendanceSubmitting || !studentId.trim()}>
                <QrCode className="mr-2 h-4 w-4" />
                {attendanceSubmitting ? 'Marking…' : qrScanning ? 'Submit scanned ID' : 'Mark attendance'}
              </Button>
            </form>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-0.5 h-5 w-5 text-secondary" />
            <div>
              <h2 className="text-title-md font-semibold text-on-surface">Messaging Test Sends</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Verify SMS and WhatsApp credentials with a safe test message.
              </p>
            </div>
          </div>

          {messagingError && (
            <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">
              {messagingError}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <form onSubmit={handleTestSms} className="bento-card space-y-4">
              <h3 className="text-title-sm font-semibold text-on-surface">Test SMS</h3>
              <div>
                <label
                  htmlFor="smsPhone"
                  className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                >
                  Phone number (to)
                </label>
                <input
                  id="smsPhone"
                  required
                  value={smsForm.to}
                  onChange={(e) => setSmsForm((prev) => ({ ...prev, to: e.target.value }))}
                  className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div>
                <label
                  htmlFor="smsMessage"
                  className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                >
                  Message
                </label>
                <textarea
                  id="smsMessage"
                  required
                  rows={4}
                  value={smsForm.message}
                  onChange={(e) => setSmsForm((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              {smsResult && (
                <div className="rounded-lg bg-success/10 px-4 py-3 text-label-md text-success">
                  Queued via {smsResult.provider} — ID {smsResult.messageId}
                </div>
              )}
              <Button type="submit" variant="primary" disabled={smsSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {smsSubmitting ? 'Sending…' : 'Send test SMS'}
              </Button>
            </form>

            <form onSubmit={handleTestWhatsApp} className="bento-card space-y-4">
              <h3 className="text-title-sm font-semibold text-on-surface">Test WhatsApp</h3>
              <div>
                <label
                  htmlFor="whatsappPhone"
                  className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                >
                  Phone number (to)
                </label>
                <input
                  id="whatsappPhone"
                  required
                  value={whatsappForm.to}
                  onChange={(e) =>
                    setWhatsappForm((prev) => ({ ...prev, to: e.target.value }))
                  }
                  className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              <div>
                <label
                  htmlFor="whatsappMessage"
                  className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                >
                  Message
                </label>
                <textarea
                  id="whatsappMessage"
                  required
                  rows={4}
                  value={whatsappForm.message}
                  onChange={(e) =>
                    setWhatsappForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>
              {whatsappResult && (
                <div className="rounded-lg bg-success/10 px-4 py-3 text-label-md text-success">
                  Queued via {whatsappResult.provider} — ID {whatsappResult.messageId}
                </div>
              )}
              <Button type="submit" variant="primary" disabled={whatsappSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {whatsappSubmitting ? 'Sending…' : 'Send test WhatsApp'}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </SchoolShell>
  );
}
