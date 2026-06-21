'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AiInsightCard,
  Badge,
  Button,
  DataTable,
  KpiBentoCard,
  TabGroup,
} from '@eduai365/ui';
import {
  AlertCircle,
  Clock,
  Mail,
  Megaphone,
  MessageSquare,
  Pin,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Cake,
  Gift,
  MessageCircle,
  Search,
  Users,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatPercent, getInitials } from '@/lib/format';
import type { EmployeeProfile } from '@/types/hr';
import { formatShortDate } from '@/lib/operations';
import type {
  AudienceFilter,
  Circular,
  CommsStats,
  CommsTab,
  ComplaintStatus,
  ComplaintThread,
  CreateBroadcastInput,
  CreateCircularInput,
  CreateComplaintInput,
  CreateComplaintMessageInput,
  DeliveryChannel,
  DeliveryStatus,
  LogsResponse,
  Notice,
  NoticeCategory,
} from '@/types/comms';
import {
  AUDIENCE_ROLE_OPTIONS,
  BROADCAST_CHANNEL_OPTIONS,
  COMMS_TAB_ITEMS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_STATUSES,
  DELIVERY_CHANNEL_LABELS,
  NOTICE_CATEGORIES,
  NOTICE_CATEGORY_LABELS,
  audienceSummary,
  commsUserName,
} from '@/types/comms';

const EMPTY_CIRCULAR: CreateCircularInput = {
  title: '',
  body: '',
  audienceFilter: { roles: [] },
};

const EMPTY_BROADCAST: CreateBroadcastInput = {
  title: '',
  message: '',
  channels: ['EMAIL'],
  audienceFilter: { roles: [] },
};

const EMPTY_COMPLAINT: CreateComplaintInput = {
  subject: '',
  description: '',
};

const MOCK_SEND_TIME = {
  recommendedTime: 'Today, 6:30 PM',
  engagementLift: 42,
  channel: 'Push + In-App',
  reason:
    'Parents open school messages most between 6–8 PM on weekdays. Scheduling now avoids SMS costs at peak hours.',
};

const BIRTHDAY_TEMPLATES = [
  {
    id: 'tpl-1',
    name: '🎉 Appreciative',
    message: (name: string) => `Wishing you a very Happy Birthday, ${name}! 🎂 Thank you for your incredible dedication and support in educating our students. We appreciate everything you do for our school. Have a wonderful day! ✨\n\n- Greenfield Academy Administration`
  },
  {
    id: 'tpl-2',
    name: '🎈 Warm & Celebration',
    message: (name: string) => `Happy Birthday, ${name}! 🎈 May this special day be filled with joy, laughter, and the company of loved ones. Wishing you good health, happiness, and success in all your endeavors. Enjoy your day! 🎁`
  },
  {
    id: 'tpl-3',
    name: '🌟 Inspirational',
    message: (name: string) => `Warmest birthday wishes, ${name}! 🌟 We are so grateful to have you as a vital part of our school family. May this new year of your life be filled with new achievements, inspiration, and wonderful moments. Have a fantastic celebration! 🎂🎉`
  }
];

function isBirthdayToday(dobString?: string): boolean {
  if (!dobString) return false;
  const dob = new Date(dobString);
  const today = new Date();
  return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
}

function isBirthdayThisMonth(dobString?: string): boolean {
  if (!dobString) return false;
  const dob = new Date(dobString);
  const today = new Date();
  return dob.getMonth() === today.getMonth();
}

function formatBirthdate(dobString?: string): string {
  if (!dobString) return '—';
  const date = new Date(dobString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getNextBirthdayDays(dobString?: string): number {
  if (!dobString) return 9999;
  const dob = new Date(dobString);
  const today = new Date();
  const nextBd = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBd.getTime() < today.getTime() - 24 * 3600 * 1000) {
    nextBd.setFullYear(today.getFullYear() + 1);
  }
  return Math.ceil((nextBd.getTime() - today.getTime()) / (1000 * 3600 * 24));
}

function noticeCategoryVariant(
  category: NoticeCategory,
): 'info' | 'success' | 'ai' | 'warning' | 'default' {
  const map: Record<NoticeCategory, 'info' | 'success' | 'ai' | 'warning' | 'default'> = {
    ACADEMIC: 'info',
    SPORTS: 'success',
    HOLIDAY: 'ai',
    EXAM: 'warning',
    GENERAL: 'default',
  };
  return map[category];
}

function deliveryStatusVariant(
  status: DeliveryStatus,
): 'success' | 'info' | 'warning' | 'error' | 'default' {
  if (status === 'DELIVERED') return 'success';
  if (status === 'SENT') return 'info';
  if (status === 'FAILED' || status === 'BOUNCED') return 'error';
  if (status === 'QUEUED' || status === 'PENDING') return 'warning';
  return 'default';
}

function complaintStatusVariant(status: ComplaintStatus): 'warning' | 'info' | 'success' {
  if (status === 'RESOLVED') return 'success';
  if (status === 'UNDER_REVIEW') return 'info';
  return 'warning';
}

function toggleAudienceRole(filter: AudienceFilter, role: string): AudienceFilter {
  const roles = filter.roles ?? [];
  const next = roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
  return { ...filter, roles: next };
}

function toggleBroadcastChannel(channels: DeliveryChannel[], channel: DeliveryChannel): DeliveryChannel[] {
  return channels.includes(channel)
    ? channels.filter((c) => c !== channel)
    : [...channels, channel];
}

export default function CommunicationHubPage() {
  const [activeTab, setActiveTab] = useState<CommsTab>('notices');
  const [stats, setStats] = useState<CommsStats | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [complaints, setComplaints] = useState<ComplaintThread[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState<NoticeCategory | 'ALL'>('ALL');
  const [logChannelFilter, setLogChannelFilter] = useState<DeliveryChannel | 'ALL'>('ALL');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCircularForm, setShowCircularForm] = useState(false);
  const [circularForm, setCircularForm] = useState(EMPTY_CIRCULAR);
  const [broadcastForm, setBroadcastForm] = useState(EMPTY_BROADCAST);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintForm, setComplaintForm] = useState(EMPTY_COMPLAINT);
  const [replyBody, setReplyBody] = useState('');

  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [birthdayFilter, setBirthdayFilter] = useState<'today' | 'month' | 'all'>('today');
  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [wishMessage, setWishMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl-1');
  const [birthdaySearch, setBirthdaySearch] = useState('');

  const selectedComplaint = useMemo(
    () => complaints.find((c) => c.id === selectedComplaintId) ?? null,
    [complaints, selectedComplaintId],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const noticeQuery =
        noticeCategoryFilter !== 'ALL' ? `?category=${noticeCategoryFilter}` : '';
      const logQuery = logChannelFilter !== 'ALL' ? `?channel=${logChannelFilter}` : '';
      const complaintQuery =
        complaintStatusFilter !== 'ALL' ? `?status=${complaintStatusFilter}` : '';

      const [statsData, noticeList, circularList, logsResponse, complaintList, employeeList] = await Promise.all([
        apiFetch<CommsStats>('/comms/stats'),
        apiFetch<Notice[]>(`/comms/notices${noticeQuery}`),
        apiFetch<Circular[]>('/comms/circulars'),
        apiFetch<LogsResponse>(`/comms/logs${logQuery}`),
        apiFetch<ComplaintThread[]>(`/comms/complaints${complaintQuery}`),
        apiFetch<EmployeeProfile[]>('/hr/employees'),
      ]);

      setStats(statsData);
      setNotices(noticeList);
      setCirculars(circularList);
      setLogsData(logsResponse);
      setComplaints(complaintList);
      setEmployees(employeeList);
      setSelectedComplaintId((current) => {
        if (!complaintList.length) return null;
        if (current && complaintList.some((c) => c.id === current)) return current;
        return complaintList[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communication data');
    } finally {
      setLoading(false);
    }
  }, [complaintStatusFilter, logChannelFilter, noticeCategoryFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreateCircular(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/comms/circulars', {
        method: 'POST',
        body: JSON.stringify(circularForm),
      });
      setCircularForm(EMPTY_CIRCULAR);
      setShowCircularForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish circular');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendBroadcast(event: React.FormEvent) {
    event.preventDefault();
    if (!broadcastForm.channels.length) {
      setError('Select at least one delivery channel');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/comms/broadcast', {
        method: 'POST',
        body: JSON.stringify(broadcastForm),
      });
      setBroadcastForm(EMPTY_BROADCAST);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send broadcast');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateComplaint(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiFetch<ComplaintThread>('/comms/complaints', {
        method: 'POST',
        body: JSON.stringify(complaintForm),
      });
      setComplaintForm(EMPTY_COMPLAINT);
      setShowComplaintForm(false);
      setSelectedComplaintId(created.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplyToComplaint(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedComplaintId || !replyBody.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateComplaintMessageInput = { body: replyBody.trim() };
      await apiFetch(`/comms/complaints/${selectedComplaintId}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setReplyBody('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendBirthdayWish(logOnly: boolean) {
    if (!selectedEmployee || !wishMessage.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/comms/birthday-wish', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedEmployee.userId,
          message: wishMessage.trim(),
        }),
      });

      await loadData();

      if (!logOnly) {
        const phone = selectedEmployee.user.phone || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
          wishMessage.trim(),
        )}`;
        window.open(whatsappUrl, '_blank');
      }

      setWishModalOpen(false);
      setSelectedEmployee(null);
      setWishMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send birthday wish');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClassName =
    'h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-3 text-body-md outline-none focus:border-secondary';

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Communication Hub</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Notices, circulars, broadcasts, delivery logs, and grievance threads
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {activeTab === 'circulars' && (
              <Button variant="primary" onClick={() => setShowCircularForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Circular
              </Button>
            )}
            {activeTab === 'complaints' && (
              <Button variant="primary" onClick={() => setShowComplaintForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Grievance
              </Button>
            )}
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiBentoCard
            label="Published Notices"
            value={loading ? '…' : (stats?.notices.published ?? 0)}
            icon={Pin}
          />
          <KpiBentoCard
            label="Circulars"
            value={loading ? '…' : (stats?.circulars.total ?? 0)}
            icon={Megaphone}
          />
          <KpiBentoCard
            label="Delivery Rate (30d)"
            value={
              loading
                ? '…'
                : formatPercent(stats?.delivery.last30Days.deliveryRate ?? 0)
            }
            icon={Mail}
          />
          <KpiBentoCard
            label="Open Grievances"
            value={loading ? '…' : (stats?.complaints.open ?? 0)}
            icon={AlertCircle}
          />
        </div>

        <AiInsightCard
          title="AI Send-Time Optimization"
          badge="DELIVERY AI"
          confidence={`+${MOCK_SEND_TIME.engagementLift}% engagement`}
          description={
            <>
              Recommended window:{' '}
              <span className="font-semibold text-secondary">{MOCK_SEND_TIME.recommendedTime}</span>{' '}
              via {MOCK_SEND_TIME.channel}. {MOCK_SEND_TIME.reason}
            </>
          }
          actionLabel="Apply Recommended Time"
          onAction={() => {
            setActiveTab('broadcast');
            setBroadcastForm((f) => ({
              ...f,
              scheduledAt: new Date(Date.now() + 4 * 3_600_000).toISOString().slice(0, 16),
            }));
          }}
        >
          <div className="mt-3 flex items-center gap-2 text-body-md text-on-surface-variant">
            <Sparkles className="h-4 w-4 text-ai-violet" />
            Switch to app push notifications — 40% higher engagement vs SMS-only campaigns
          </div>
        </AiInsightCard>

        <TabGroup
          tabs={COMMS_TAB_ITEMS}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as CommsTab)}
        />

        {error && (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
        )}

        {activeTab === 'notices' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={noticeCategoryFilter === 'ALL' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setNoticeCategoryFilter('ALL')}
              >
                All
              </Button>
              {NOTICE_CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant={noticeCategoryFilter === category ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setNoticeCategoryFilter(category)}
                >
                  {NOTICE_CATEGORY_LABELS[category]}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                Loading notices…
              </div>
            ) : notices.length === 0 ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                No notices on the board yet
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {notices.map((notice) => (
                  <article key={notice.id} className="bento-card space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={noticeCategoryVariant(notice.category)}>
                          {NOTICE_CATEGORY_LABELS[notice.category]}
                        </Badge>
                        {notice.isPinned && (
                          <Badge variant="warning">
                            <Pin className="mr-1 h-3 w-3" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <span className="text-label-md text-on-surface-variant">
                        {formatShortDate(notice.publishedAt)}
                      </span>
                    </div>
                    <h3 className="text-title-lg font-semibold text-on-surface">{notice.title}</h3>
                    <p className="text-body-md text-on-surface-variant">{notice.body}</p>
                    <p className="text-label-md text-on-surface-variant">
                      Posted by {commsUserName(notice.createdBy)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'circulars' && (
          <div className="space-y-4">
            {showCircularForm && (
              <form onSubmit={handleCreateCircular} className="bento-card grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-label-md text-on-surface-variant">Title</label>
                  <input
                    required
                    value={circularForm.title}
                    onChange={(e) => setCircularForm((f) => ({ ...f, title: e.target.value }))}
                    className={inputClassName}
                    placeholder="Circular title"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-label-md text-on-surface-variant">Body</label>
                  <textarea
                    required
                    rows={4}
                    value={circularForm.body}
                    onChange={(e) => setCircularForm((f) => ({ ...f, body: e.target.value }))}
                    className={`${inputClassName} h-auto py-2`}
                    placeholder="Circular content"
                  />
                </div>
                <div className="md:col-span-2">
                  <p className="mb-2 text-label-md text-on-surface-variant">Audience</p>
                  <div className="flex flex-wrap gap-3">
                    {AUDIENCE_ROLE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 rounded-lg border border-surface-faint px-3 py-2 text-body-md"
                      >
                        <input
                          type="checkbox"
                          checked={circularForm.audienceFilter?.roles?.includes(option.value) ?? false}
                          onChange={() =>
                            setCircularForm((f) => ({
                              ...f,
                              audienceFilter: toggleAudienceRole(
                                f.audienceFilter ?? { roles: [] },
                                option.value,
                              ),
                            }))
                          }
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-label-md text-on-surface-variant">
                    Leave unchecked to publish to the entire school
                  </p>
                </div>
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? 'Publishing…' : 'Publish Circular'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowCircularForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <DataTable
              columns={[
                {
                  key: 'publishedAt',
                  header: 'Published',
                  render: (row) => formatShortDate(row.publishedAt),
                },
                { key: 'title', header: 'Title' },
                {
                  key: 'audience',
                  header: 'Audience',
                  render: (row) => audienceSummary(row.audienceFilter ?? {}),
                },
                {
                  key: 'author',
                  header: 'Author',
                  render: (row) => commsUserName(row.createdBy),
                },
              ]}
              data={circulars}
              keyExtractor={(row) => row.id}
              emptyMessage={loading ? 'Loading circulars…' : 'No circulars published yet'}
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bento-card">
                <p className="text-label-md text-on-surface-variant">Total Messages</p>
                <p className="mt-1 text-headline-sm font-bold text-on-surface">
                  {loading ? '…' : (logsData?.summary.total ?? 0)}
                </p>
              </div>
              <div className="bento-card">
                <p className="text-label-md text-on-surface-variant">Delivered</p>
                <p className="mt-1 text-headline-sm font-bold text-success">
                  {loading ? '…' : (logsData?.summary.delivered ?? 0)}
                </p>
              </div>
              <div className="bento-card">
                <p className="text-label-md text-on-surface-variant">Delivery Rate</p>
                <p className="mt-1 text-headline-sm font-bold text-secondary">
                  {loading ? '…' : formatPercent(logsData?.summary.deliveryRate ?? 0)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={logChannelFilter === 'ALL' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setLogChannelFilter('ALL')}
              >
                All Channels
              </Button>
              {(['EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'IN_APP'] as DeliveryChannel[]).map(
                (channel) => (
                  <Button
                    key={channel}
                    variant={logChannelFilter === channel ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setLogChannelFilter(channel)}
                  >
                    {DELIVERY_CHANNEL_LABELS[channel]}
                  </Button>
                ),
              )}
            </div>

            <DataTable
              columns={[
                {
                  key: 'sentAt',
                  header: 'Sent',
                  render: (row) =>
                    row.sentAt ? formatShortDate(row.sentAt) : formatShortDate(row.createdAt),
                },
                {
                  key: 'channel',
                  header: 'Channel',
                  render: (row) => (
                    <Badge variant="info">{DELIVERY_CHANNEL_LABELS[row.channel]}</Badge>
                  ),
                },
                {
                  key: 'recipient',
                  header: 'Recipient',
                  render: (row) =>
                    row.recipient
                      ? commsUserName(row.recipient)
                      : (row.recipientContact ?? '—'),
                },
                {
                  key: 'subject',
                  header: 'Subject',
                  render: (row) => row.subject ?? row.campaign?.title ?? '—',
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <Badge variant={deliveryStatusVariant(row.status)}>{row.status}</Badge>
                  ),
                },
              ]}
              data={logsData?.logs ?? []}
              keyExtractor={(row) => row.id}
              emptyMessage={loading ? 'Loading delivery log…' : 'No messages logged yet'}
            />
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={complaintStatusFilter === 'ALL' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setComplaintStatusFilter('ALL')}
              >
                All
              </Button>
              {COMPLAINT_STATUSES.map((status) => (
                <Button
                  key={status}
                  variant={complaintStatusFilter === status ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setComplaintStatusFilter(status)}
                >
                  {COMPLAINT_STATUS_LABELS[status]}
                </Button>
              ))}
            </div>

            {showComplaintForm && (
              <form onSubmit={handleCreateComplaint} className="bento-card grid gap-4">
                <div>
                  <label className="mb-1 block text-label-md text-on-surface-variant">Subject</label>
                  <input
                    required
                    value={complaintForm.subject}
                    onChange={(e) => setComplaintForm((f) => ({ ...f, subject: e.target.value }))}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-label-md text-on-surface-variant">
                    Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={complaintForm.description}
                    onChange={(e) =>
                      setComplaintForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className={`${inputClassName} h-auto py-2`}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Grievance'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowComplaintForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="grid gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
              <div className="bento-card max-h-[520px] space-y-2 overflow-y-auto p-2">
                {loading ? (
                  <p className="p-4 text-body-md text-on-surface-variant">Loading threads…</p>
                ) : complaints.length === 0 ? (
                  <p className="p-4 text-body-md text-on-surface-variant">No grievance threads</p>
                ) : (
                  complaints.map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => setSelectedComplaintId(thread.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                        selectedComplaintId === thread.id
                          ? 'border-secondary bg-secondary/5'
                          : 'border-transparent hover:bg-surface-faint'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-on-surface">{thread.subject}</p>
                        <Badge variant={complaintStatusVariant(thread.status)}>
                          {COMPLAINT_STATUS_LABELS[thread.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-body-md text-on-surface-variant">
                        {commsUserName(thread.submittedBy)}
                      </p>
                      <p className="mt-1 text-label-md text-on-surface-variant">
                        {formatShortDate(thread.updatedAt)}
                      </p>
                    </button>
                  ))
                )}
              </div>

              <div className="bento-card flex min-h-[420px] flex-col">
                {selectedComplaint ? (
                  <>
                    <div className="border-b border-surface-faint pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-title-lg font-semibold text-on-surface">
                          {selectedComplaint.subject}
                        </h3>
                        <Badge variant={complaintStatusVariant(selectedComplaint.status)}>
                          {COMPLAINT_STATUS_LABELS[selectedComplaint.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-body-md text-on-surface-variant">
                        Submitted by {commsUserName(selectedComplaint.submittedBy)} ·{' '}
                        {formatShortDate(selectedComplaint.createdAt)}
                      </p>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto py-4">
                      {selectedComplaint.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`max-w-[85%] rounded-lg px-4 py-3 ${
                            message.isStaffReply
                              ? 'ml-auto bg-secondary/10 text-on-surface'
                              : 'bg-surface-faint text-on-surface'
                          }`}
                        >
                          <p className="text-label-md font-semibold text-on-surface-variant">
                            {commsUserName(message.sender)}
                            {message.isStaffReply ? ' · Staff' : ''}
                          </p>
                          <p className="mt-1 text-body-md">{message.body}</p>
                          <p className="mt-2 text-label-md text-on-surface-variant">
                            {formatShortDate(message.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {selectedComplaint.status !== 'RESOLVED' && (
                      <form
                        onSubmit={handleReplyToComplaint}
                        className="border-t border-surface-faint pt-4"
                      >
                        <label className="mb-1 block text-label-md text-on-surface-variant">
                          Reply to thread
                        </label>
                        <div className="flex gap-2">
                          <input
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            className={inputClassName}
                            placeholder="Type your response…"
                          />
                          <Button type="submit" variant="primary" disabled={submitting}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    )}
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-body-md text-on-surface-variant">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Select a grievance thread to view messages
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <form onSubmit={handleSendBroadcast} className="bento-card space-y-4">
              <h3 className="text-title-lg font-semibold text-on-surface">Compose Broadcast</h3>
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Title</label>
                <input
                  required
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputClassName}
                  placeholder="Message title"
                />
              </div>
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Message</label>
                <textarea
                  required
                  rows={5}
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm((f) => ({ ...f, message: e.target.value }))}
                  className={`${inputClassName} h-auto py-2`}
                  placeholder="Write your broadcast message…"
                />
              </div>
              <div>
                <p className="mb-2 text-label-md text-on-surface-variant">Delivery Channels</p>
                <div className="flex flex-wrap gap-3">
                  {BROADCAST_CHANNEL_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 rounded-lg border border-surface-faint px-3 py-2 text-body-md"
                    >
                      <input
                        type="checkbox"
                        checked={broadcastForm.channels.includes(option.value)}
                        onChange={() =>
                          setBroadcastForm((f) => ({
                            ...f,
                            channels: toggleBroadcastChannel(f.channels, option.value),
                          }))
                        }
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-label-md text-on-surface-variant">Audience</p>
                <div className="flex flex-wrap gap-3">
                  {AUDIENCE_ROLE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 rounded-lg border border-surface-faint px-3 py-2 text-body-md"
                    >
                      <input
                        type="checkbox"
                        checked={
                          broadcastForm.audienceFilter.roles?.includes(option.value) ?? false
                        }
                        onChange={() =>
                          setBroadcastForm((f) => ({
                            ...f,
                            audienceFilter: toggleAudienceRole(
                              f.audienceFilter ?? { roles: [] },
                              option.value,
                            ),
                          }))
                        }
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">
                  Schedule (optional)
                </label>
                <input
                  type="datetime-local"
                  value={broadcastForm.scheduledAt ?? ''}
                  onChange={(e) =>
                    setBroadcastForm((f) => ({
                      ...f,
                      scheduledAt: e.target.value || undefined,
                    }))
                  }
                  className={inputClassName}
                />
              </div>
              <Button type="submit" variant="primary" disabled={submitting}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Sending…' : 'Send Broadcast'}
              </Button>
            </form>

            <div className="space-y-4">
              <div className="bento-card">
                <h3 className="text-title-lg font-semibold text-on-surface">Recent Campaigns</h3>
                <div className="mt-4 space-y-3">
                  {loading ? (
                    <p className="text-body-md text-on-surface-variant">Loading…</p>
                  ) : (stats?.campaigns.recent.length ?? 0) === 0 ? (
                    <p className="text-body-md text-on-surface-variant">No campaigns yet</p>
                  ) : (
                    stats?.campaigns.recent.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="rounded-lg bg-surface-faint px-3 py-3 text-body-md"
                      >
                        <p className="font-semibold text-on-surface">{campaign.title}</p>
                        <p className="mt-1 text-on-surface-variant">
                          {campaign.channels.map((c) => DELIVERY_CHANNEL_LABELS[c]).join(', ')}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-label-md text-on-surface-variant">
                          <span>{campaign.status}</span>
                          <span>
                            {campaign.deliveredCount}/{campaign.totalRecipients} delivered
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bento-card">
                <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
                  <Clock className="h-4 w-4" />
                  Scheduled broadcasts appear in delivery log after send time
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'birthdays' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className={`bento-card relative overflow-hidden transition-all duration-300 ${
                employees.filter(e => isBirthdayToday(e.dateOfBirth)).length > 0 
                  ? 'border-pink-300 bg-gradient-to-br from-pink-500/10 to-violet-500/10 shadow-lg shadow-pink-500/5' 
                  : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-label-md font-semibold text-on-surface-variant">{"Today's Birthdays"}</p>
                    <p className="mt-2 text-headline-md font-extrabold text-on-surface">
                      {loading ? '…' : employees.filter(e => isBirthdayToday(e.dateOfBirth)).length}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${
                    employees.filter(e => isBirthdayToday(e.dateOfBirth)).length > 0 
                      ? 'bg-pink-500 text-white animate-bounce' 
                      : 'bg-surface-faint text-on-surface-variant'
                  }`}>
                    <Cake className="h-6 w-6" />
                  </div>
                </div>
                {employees.filter(e => isBirthdayToday(e.dateOfBirth)).length > 0 && (
                  <div className="mt-2 text-label-md text-pink-600 dark:text-pink-400 font-medium">
                    Someone is celebrating today! 🥳
                  </div>
                )}
              </div>

              <div className="bento-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-label-md font-semibold text-on-surface-variant">{"This Month's Birthdays"}</p>
                    <p className="mt-2 text-headline-md font-extrabold text-on-surface">
                      {loading ? '…' : employees.filter(e => isBirthdayThisMonth(e.dateOfBirth)).length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-surface-faint text-on-surface-variant">
                    <Gift className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-2 text-label-md text-on-surface-variant">
                  Celebrating in {new Date().toLocaleString('en-US', { month: 'long' })}
                </p>
              </div>

              <div className="bento-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-label-md font-semibold text-on-surface-variant">Total Staff Directory</p>
                    <p className="mt-2 text-headline-md font-extrabold text-on-surface">
                      {loading ? '…' : employees.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-surface-faint text-on-surface-variant">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-2 text-label-md text-on-surface-variant">Registered school employees</p>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={birthdayFilter === 'today' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setBirthdayFilter('today')}
                >
                  🎂 {"Today's Birthdays"}
                </Button>
                <Button
                  variant={birthdayFilter === 'month' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setBirthdayFilter('month')}
                >
                  📅 This Month
                </Button>
                <Button
                  variant={birthdayFilter === 'all' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setBirthdayFilter('all')}
                >
                  👥 All Staff
                </Button>
              </div>

              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="search"
                  placeholder="Search staff by name or dept…"
                  value={birthdaySearch}
                  onChange={(e) => setBirthdaySearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-300/30 bg-white pl-9 pr-4 text-body-md outline-none focus:border-secondary"
                />
              </div>
            </div>

            {/* Staff Grid */}
            {loading ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">Loading staff records…</div>
            ) : (() => {
              const query = birthdaySearch.trim().toLowerCase();
              
              // Filter logic
              const filteredStaff = employees.filter((emp) => {
                const name = `${emp.user.firstName} ${emp.user.lastName}`.toLowerCase();
                const matchesSearch = name.includes(query) || emp.department.toLowerCase().includes(query) || emp.designation.toLowerCase().includes(query);
                if (!matchesSearch) return false;

                if (birthdayFilter === 'today') return isBirthdayToday(emp.dateOfBirth);
                if (birthdayFilter === 'month') return isBirthdayThisMonth(emp.dateOfBirth);
                return true;
              });

              // Sort logic: if filter is 'all', sort by next upcoming birthday
              const sortedStaff = [...filteredStaff].sort((a, b) => {
                if (birthdayFilter === 'all') {
                  return getNextBirthdayDays(a.dateOfBirth) - getNextBirthdayDays(b.dateOfBirth);
                }
                return 0;
              });

              if (sortedStaff.length === 0) {
                return (
                  <div className="bento-card py-16 text-center text-on-surface-variant">
                    No staff birthdays found matching the filter
                  </div>
                );
              }

              return (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sortedStaff.map((emp) => {
                    const name = `${emp.user.firstName} ${emp.user.lastName}`;
                    const initials = getInitials(emp.user.firstName, emp.user.lastName);
                    const isToday = isBirthdayToday(emp.dateOfBirth);
                    const isMonth = isBirthdayThisMonth(emp.dateOfBirth);
                    
                    return (
                      <div
                        key={emp.id}
                        className={`bento-card flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${
                          isToday 
                            ? 'border-pink-300 bg-gradient-to-br from-pink-500/5 to-violet-500/5 ring-1 ring-pink-500/20 shadow-md shadow-pink-500/5' 
                            : ''
                        }`}
                      >
                        <div>
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                              isToday 
                                ? 'bg-pink-500 text-white animate-pulse' 
                                : 'bg-secondary/10 text-secondary'
                            }`}>
                              {initials}
                            </div>
                            <div className="text-right">
                              {isToday ? (
                                <span className="inline-flex items-center rounded-full bg-pink-100 dark:bg-pink-900/30 px-2.5 py-0.5 text-xs font-semibold text-pink-600 dark:text-pink-400">
                                  🎉 Today!
                                </span>
                              ) : isMonth ? (
                                <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                  🍰 This Month
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="mt-4">
                            <h4 className="text-title-md font-semibold text-on-surface">{name}</h4>
                            <p className="text-body-md text-on-surface-variant">
                              {emp.designation} · {emp.department}
                            </p>
                            <div className="mt-4 flex items-center justify-between border-t border-surface-faint pt-3 text-body-md text-on-surface-variant">
                              <span>Birthday</span>
                              <span className="font-semibold text-on-surface">
                                {formatBirthdate(emp.dateOfBirth)}
                              </span>
                            </div>
                            {emp.user.phone && (
                              <div className="mt-2 flex items-center justify-between text-body-md text-on-surface-variant">
                                <span>Phone</span>
                                <span className="font-mono">{emp.user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action */}
                        <div className="mt-6">
                          <Button
                            variant={isToday ? 'primary' : 'secondary'}
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setWishMessage(BIRTHDAY_TEMPLATES[0]!.message(name));
                              setSelectedTemplateId('tpl-1');
                              setWishModalOpen(true);
                            }}
                          >
                            <Cake className="h-4 w-4" />
                            Send Wish
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {wishModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl border border-gray-300/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
            {/* Left Panel: Compose */}
            <div className="flex-1 p-6 md:p-8 space-y-6 border-b border-surface-faint md:border-b-0 md:border-r border-gray-300/20">
              <div>
                <h3 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
                  <Cake className="text-pink-500 h-6 w-6" />
                  Compose Birthday Wish
                </h3>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Select a template and customize the message for {selectedEmployee.user.firstName} {selectedEmployee.user.lastName}.
                </p>
              </div>

              {/* Template Selector */}
              <div className="space-y-2">
                <label className="text-label-md font-semibold text-on-surface-variant">Choose Template</label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {BIRTHDAY_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        setWishMessage(tpl.message(`${selectedEmployee.user.firstName} ${selectedEmployee.user.lastName}`));
                      }}
                      className={`text-left p-3 rounded-xl border text-body-md transition-all ${
                        selectedTemplateId === tpl.id
                          ? 'border-secondary bg-secondary/5 font-semibold text-secondary ring-1 ring-secondary/20'
                          : 'border-transparent bg-surface-faint hover:bg-surface-faint/80 text-on-surface-variant'
                      }`}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Composer */}
              <div className="space-y-1.5">
                <label className="text-label-md font-semibold text-on-surface-variant" htmlFor="wishMessage">Custom Message</label>
                <textarea
                  id="wishMessage"
                  rows={6}
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  className="w-full rounded-xl border border-gray-300/30 bg-surface-faint px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  variant="primary"
                  className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128c7e] text-white border-none"
                  disabled={submitting}
                  onClick={() => void handleSendBirthdayWish(false)}
                >
                  <MessageCircle className="h-4 w-4 fill-white" />
                  {submitting ? 'Sending…' : 'Send via WhatsApp'}
                </Button>
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                  disabled={submitting}
                  onClick={() => void handleSendBirthdayWish(true)}
                >
                  <Send className="h-4 w-4" />
                  Log as Sent
                </Button>
                <Button
                  variant="ghost"
                  disabled={submitting}
                  onClick={() => {
                    setWishModalOpen(false);
                    setSelectedEmployee(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Right Panel: Live Mobile Preview */}
            <div className="w-full md:w-[360px] bg-surface-faint p-6 md:p-8 flex flex-col items-center justify-center">
              <p className="mb-4 text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">Live Preview</p>
              
              {/* WhatsApp Smartphone Frame Mockup */}
              <div className="w-72 border-[8px] border-slate-800 rounded-[32px] overflow-hidden shadow-2xl bg-[#efeae2] flex flex-col aspect-[9/18]">
                {/* Status Bar / Notch */}
                <div className="h-6 bg-[#075E54] flex items-center justify-between px-5 text-[10px] text-white/80 shrink-0">
                  <span>12:00</span>
                  <div className="flex gap-1">
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </div>
                
                {/* WhatsApp Chat Header */}
                <div className="bg-[#075E54] px-3 py-2 flex items-center gap-2 shrink-0">
                  <div className="text-white text-xs">←</div>
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs font-mono">
                    {getInitials(selectedEmployee.user.firstName, selectedEmployee.user.lastName)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-white font-semibold text-xs truncate">
                      {selectedEmployee.user.firstName} {selectedEmployee.user.lastName}
                    </p>
                    <p className="text-[9px] text-white/85">online</p>
                  </div>
                  <div className="text-white text-xs flex gap-2">
                    <span>📞</span>
                    <span>⋮</span>
                  </div>
                </div>

                {/* WhatsApp Chat Area */}
                <div className="flex-1 p-3 flex flex-col justify-end overflow-hidden" style={{ backgroundImage: 'radial-gradient(#dfdcd6 1px, transparent 0)', backgroundSize: '12px 12px' }}>
                  {/* Chat bubble sent by Admin */}
                  <div className="bg-[#dcf8c6] rounded-lg p-2.5 max-w-[85%] ml-auto text-[11px] leading-snug shadow relative text-slate-800 animate-in slide-in-from-bottom duration-200">
                    <p className="whitespace-pre-wrap text-left">{wishMessage || 'Type your message...'}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[8px] text-slate-500/80">
                      <span>12:00 PM</span>
                      <span className="text-[#34b7f1] font-semibold">✓✓</span>
                    </div>
                    {/* speech bubble arrow tail */}
                    <div className="absolute right-[-4px] top-2 w-0 h-0 border-t-[4px] border-t-[#dcf8c6] border-r-[4px] border-r-transparent border-b-[4px] border-b-transparent border-l-[4px] border-l-[#dcf8c6]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SchoolShell>
  );
}
