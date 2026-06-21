'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AiInsightCard,
  Badge,
  Button,
  DataTable,
  KpiBentoCard,
} from '@eduai365/ui';
import {
  Check,
  Copy,
  Download,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Link2,
  Mail,
  Network,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInrLakh, formatPercent } from '@/lib/format';
import {
  ALUMNI_TALENT_MATCHES,
  buildAlumniGlobalMap,
  buildAlumniStats,
  deriveAlumniDirectoryRow,
  parseDecimal,
  submitMockDonation,
} from '@/lib/extended';
import type {
  AlumniCampaign,
  AlumniDirectoryRow,
  AlumniProfile,
} from '@/types/extended';
import {
  ALUMNI_DIRECTORY_STATUS_LABELS,
  alumniDirectoryStatusVariant,
  campaignProgressPct,
} from '@/types/extended';

const CAMPAIGN_COLORS = ['bg-secondary', 'bg-success', 'bg-ai-violet'];

export default function AlumniPage() {
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [campaigns, setCampaigns] = useState<AlumniCampaign[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donationCampaignId, setDonationCampaignId] = useState<string | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState<string | null>(null);

  // ── Invite Alumni ──────────────────────────────────────────────────────────
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteNote, setInviteNote] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const INVITE_LINK = `${typeof window !== 'undefined' ? window.location.origin : ''}/alumni/register`;

  function handleCopyLink() {
    void navigator.clipboard.writeText(INVITE_LINK).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  }

  function handleSendInvites(e: React.FormEvent) {
    e.preventDefault();
    const emails = inviteEmails
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!emails.length) return;
    setInviteSending(true);
    // Simulate async send
    setTimeout(() => {
      setInviteSending(false);
      setInviteSent(true);
      setTimeout(() => {
        setInviteSent(false);
        setShowInvite(false);
        setInviteEmails('');
        setInviteNote('');
      }, 2000);
    }, 1200);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profilesData, campaignsData] = await Promise.all([
        apiFetch<AlumniProfile[]>('/extended/alumni'),
        apiFetch<AlumniCampaign[]>('/extended/alumni/campaigns'),
      ]);
      setProfiles(profilesData);
      setCampaigns(campaignsData.filter((c) => c.status === 'ACTIVE'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alumni data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(() => buildAlumniStats(profiles, campaigns), [profiles, campaigns]);
  const globalMap = useMemo(() => buildAlumniGlobalMap(profiles), [profiles]);

  const directoryRows = useMemo(() => {
    const rows = profiles.map((p, i) => deriveAlumniDirectoryRow(p, i));
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.company.toLowerCase().includes(q) ||
        row.profession.toLowerCase().includes(q) ||
        row.city.toLowerCase().includes(q),
    );
  }, [profiles, search]);

  function handleMockDonation(e: React.FormEvent) {
    e.preventDefault();
    if (!donationCampaignId || !donorName.trim() || !donationAmount) return;
    const result = submitMockDonation({
      campaignId: donationCampaignId,
      donorName: donorName.trim(),
      amount: Number(donationAmount),
    });
    setDonationMessage(result.message);
    setDonorName('');
    setDonationAmount('');
    setDonationCampaignId(null);
  }

  const directoryColumns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (row: AlumniDirectoryRow) => (
          <div>
            <p className="font-medium text-on-surface">{row.name}</p>
            <p className="text-body-sm text-on-surface-variant">Class of &apos;{String(row.batchYear).slice(-2)}</p>
          </div>
        ),
      },
      { key: 'company', header: 'Current Company', render: (row: AlumniDirectoryRow) => row.company },
      { key: 'designation', header: 'Designation', render: (row: AlumniDirectoryRow) => row.designation },
      {
        key: 'industry',
        header: 'Industry',
        render: (row: AlumniDirectoryRow) => (
          <Badge variant="info">{row.industry}</Badge>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: AlumniDirectoryRow) => (
          <Badge variant={alumniDirectoryStatusVariant(row.directoryStatus)}>
            {ALUMNI_DIRECTORY_STATUS_LABELS[row.directoryStatus]}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row: AlumniDirectoryRow) => (
          <Button variant="ghost" size="sm" onClick={() => setDonationCampaignId(campaigns[0]?.id ?? row.id)}>
            Donate
          </Button>
        ),
      },
    ],
    [campaigns],
  );

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Alumni Relations Dashboard</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Harnessing AI to bridge current education and professional excellence
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="md">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button variant="primary" size="md" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-4 w-4" />
              Invite Alumni
            </Button>
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center rounded-lg px-3 py-2 text-body-md text-on-surface-variant hover:bg-surface-faint"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiBentoCard
            label="Total Alumni"
            value={loading ? '…' : stats.totalAlumni.toLocaleString('en-IN')}
            icon={GraduationCap}
            trend={{ value: `+${stats.totalAlumniTrend}% from last year`, direction: 'up' }}
          />
          <KpiBentoCard
            label="Donation Growth"
            value={loading ? '…' : formatInrLakh(stats.donationTotal)}
            icon={HeartHandshake}
            trend={{ value: `${stats.donationGrowthPct}% growth (YTD)`, direction: 'up' }}
          />
          <KpiBentoCard
            label="Engagement Rate"
            value={loading ? '…' : formatPercent(stats.engagementRate, 1)}
            icon={Network}
            trend={{ value: stats.engagementNote, direction: 'neutral' }}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-md text-error">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <AiInsightCard
            className="lg:col-span-2"
            title="AI Talent Matcher"
            description="Identified alumni who align with the current Computer Science curriculum for guest lectures and student mentorship programs."
            badge="AI MATCHING"
          >
            <div className="mt-4 space-y-3">
              {ALUMNI_TALENT_MATCHES.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center gap-4 rounded-lg border border-surface-faint bg-surface-container-lowest px-4 py-3"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ai-violet/10 text-sm font-semibold text-ai-violet">
                    {match.avatarInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-on-surface">{match.name}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      {match.title} @ {match.company}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    <Badge variant="ai">{match.matchPct}% Match</Badge>
                    <Badge variant="info">{match.roleTag}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </AiInsightCard>

          <section className="rounded-lg border border-surface-faint bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-title-lg font-semibold text-on-surface">Active Campaigns</h2>
              <Sparkles className="h-4 w-4 text-on-surface-variant" />
            </div>
            <ul className="mt-4 space-y-4">
              {(loading ? [] : campaigns.slice(0, 3)).map((campaign, index) => {
                const raised = parseDecimal(campaign.raised);
                const goal = parseDecimal(campaign.goal);
                const pct = campaignProgressPct(raised, goal);
                return (
                  <li key={campaign.id}>
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="font-medium text-on-surface">{campaign.title}</span>
                      <span className="text-on-surface-variant">
                        {formatInrLakh(raised)} / {formatInrLakh(goal)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-faint">
                      <div
                        className={`h-full rounded-full ${CAMPAIGN_COLORS[index % CAMPAIGN_COLORS.length]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <Button variant="ghost" size="sm" className="mt-4 w-full">
              View All Campaigns
            </Button>
          </section>
        </div>

        <section className="rounded-lg border border-surface-faint bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-title-lg font-semibold text-on-surface">Alumni Directory</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alumni, companies…"
                className="rounded-lg border border-surface-faint py-2 pl-9 pr-3 text-body-md outline-none focus:border-secondary"
              />
            </div>
          </div>
          <div className="mt-4">
            <DataTable
              columns={directoryColumns}
              data={directoryRows}
              keyExtractor={(row) => row.id}
              emptyMessage={loading ? 'Loading directory…' : 'No alumni match your search.'}
            />
          </div>
        </section>

        <section className="rounded-lg border border-surface-faint bg-white p-5">
          <div className="flex items-start gap-3">
            <Globe2 className="mt-1 h-6 w-6 text-secondary" />
            <div>
              <h2 className="text-title-lg font-semibold text-on-surface">Global Alumni Network</h2>
              <p className="text-body-sm text-on-surface-variant">
                Visualization of alumni distribution across {globalMap.countryCount} countries and major hubs
              </p>
            </div>
          </div>

          <div className="relative mt-6 aspect-[2/1] overflow-hidden rounded-xl bg-gradient-to-b from-surface-container-low to-surface-faint">
            <div className="absolute inset-0 opacity-30">
              <svg viewBox="0 0 800 400" className="h-full w-full text-on-surface-variant/20" aria-hidden>
                <ellipse cx="400" cy="200" rx="360" ry="160" fill="currentColor" />
              </svg>
            </div>
            {globalMap.hubs.map((hub) => (
              <div
                key={hub.id}
                className="absolute flex flex-col items-center"
                style={{ left: hub.position.left, top: hub.position.top }}
              >
                <span
                  className={`h-4 w-4 rounded-full shadow-lg ${
                    hub.color === 'blue'
                      ? 'bg-secondary shadow-secondary/50'
                      : hub.color === 'purple'
                        ? 'bg-ai-violet shadow-ai-violet/50'
                        : 'bg-success shadow-success/50'
                  }`}
                />
                <span className="mt-1 whitespace-nowrap rounded bg-white/90 px-2 py-0.5 text-label-md text-on-surface shadow-sm">
                  {hub.label}
                </span>
              </div>
            ))}
            <p className="absolute bottom-4 left-4 text-body-sm text-on-surface-variant">
              {globalMap.totalAlumni.toLocaleString('en-IN')} alumni worldwide
            </p>
          </div>
        </section>

        {/* ── Invite Alumni Modal ─────────────────────────────────────────── */}
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="absolute inset-0" aria-hidden onClick={() => !inviteSending && setShowInvite(false)} />
            <div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">

              {/* Header */}
              <div className="flex items-start justify-between bg-gradient-to-r from-secondary/10 to-ai-violet/10 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/15">
                    <UserPlus className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-title-lg font-bold text-on-surface">Invite Alumni</h2>
                    <p className="text-body-sm text-on-surface-variant">Send personalised email invitations to reconnect</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  disabled={inviteSending}
                  onClick={() => setShowInvite(false)}
                  className="rounded-lg p-1.5 text-on-surface-variant hover:bg-black/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {inviteSent ? (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                    <Check className="h-7 w-7 text-success" />
                  </div>
                  <p className="text-title-md font-semibold text-on-surface">Invitations sent!</p>
                  <p className="text-body-md text-on-surface-variant">Alumni will receive an email with the registration link.</p>
                </div>
              ) : (
                <form onSubmit={handleSendInvites} className="space-y-5 px-6 py-5">

                  {/* Copy invite link shortcut */}
                  <div className="flex items-center gap-2 rounded-lg border border-surface-faint bg-surface-container-low px-3 py-2.5">
                    <Link2 className="h-4 w-4 shrink-0 text-on-surface-variant" />
                    <span className="flex-1 truncate text-body-sm text-on-surface-variant">{INVITE_LINK}</span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-label-md font-medium text-secondary hover:bg-secondary/10 transition-colors"
                    >
                      {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {linkCopied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <div className="flex-1 border-t border-surface-faint" />
                    <span className="mx-3 text-label-sm text-on-surface-variant">or send via email</span>
                    <div className="flex-1 border-t border-surface-faint" />
                  </div>

                  {/* Email addresses */}
                  <div>
                    <label htmlFor="inviteEmails" className="mb-1.5 flex items-center gap-1.5 text-label-md font-medium text-on-surface-variant">
                      <Mail className="h-3.5 w-3.5" />
                      Email Addresses <span className="text-error">*</span>
                    </label>
                    <textarea
                      id="inviteEmails"
                      required
                      rows={3}
                      value={inviteEmails}
                      onChange={(e) => setInviteEmails(e.target.value)}
                      placeholder="alumni@example.com, another@example.com&#10;(one per line or comma-separated)"
                      className="w-full resize-none rounded-lg border border-gray-300/40 bg-surface-faint/60 px-4 py-2.5 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    />
                    <p className="mt-1 text-label-sm text-on-surface-variant">Separate multiple addresses with commas or new lines.</p>
                  </div>

                  {/* Personal message */}
                  <div>
                    <label htmlFor="inviteNote" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                      Personal Message <span className="text-label-sm font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="inviteNote"
                      rows={3}
                      value={inviteNote}
                      onChange={(e) => setInviteNote(e.target.value)}
                      placeholder="We'd love to have you back in our alumni network…"
                      className="w-full resize-none rounded-lg border border-gray-300/40 bg-surface-faint/60 px-4 py-2.5 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <Button type="button" variant="ghost" disabled={inviteSending} onClick={() => setShowInvite(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={inviteSending}>
                      {inviteSending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Invites
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {donationCampaignId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
              onSubmit={handleMockDonation}
              className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-xl"
            >
              <h3 className="text-title-lg font-semibold text-on-surface">Record Donation (Mock)</h3>
              <p className="text-body-sm text-on-surface-variant">
                Simulated payment — no charge is processed.
              </p>
              <input
                type="text"
                required
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Donor name"
                className="w-full rounded-lg border border-surface-faint px-3 py-2 text-body-md"
              />
              <input
                type="number"
                required
                min={1}
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Amount (INR)"
                className="w-full rounded-lg border border-surface-faint px-3 py-2 text-body-md"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setDonationCampaignId(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Confirm Donation
                </Button>
              </div>
            </form>
          </div>
        )}

        {donationMessage && (
          <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-body-md text-on-surface">
            {donationMessage}
            <button
              type="button"
              className="ml-3 text-secondary hover:underline"
              onClick={() => setDonationMessage(null)}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </SchoolShell>
  );
}
