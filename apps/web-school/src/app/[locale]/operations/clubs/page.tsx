'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, KpiBentoCard } from '@eduai365/ui';
import {
  CalendarDays,
  Crown,
  RefreshCw,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import {
  clubCategoryClass,
  clubMembershipPct,
  formatShortDate,
  studentDisplayName,
} from '@/lib/operations';
import type { ClubActivityEntry, ClubMember, ClubSummary } from '@/types/operations';

export default function ClubsPage() {
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinStudentId, setJoinStudentId] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ClubSummary[]>('/operations/clubs');
      setClubs(data);
      setSelectedClubId((prev) => prev ?? data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async (clubId: string) => {
    setMembersLoading(true);
    try {
      const data = await apiFetch<ClubMember[]>(`/operations/clubs/members/${clubId}`);
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load club members');
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClubs();
  }, [loadClubs]);

  useEffect(() => {
    if (selectedClubId) {
      void loadMembers(selectedClubId);
    }
  }, [selectedClubId, loadMembers]);

  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  const activityLog = useMemo<ClubActivityEntry[]>(() => {
    return members.slice(0, 8).map((member) => ({
      id: member.id,
      clubName: selectedClub?.name ?? 'Club',
      action: 'Member joined',
      detail: `${studentDisplayName(member.student)} enrolled`,
      timestamp: member.joinedAt,
    }));
  }, [members, selectedClub?.name]);

  const membershipChart = useMemo(
    () =>
      clubs.map((club) => ({
        name: club.name.length > 12 ? `${club.name.slice(0, 12)}…` : club.name,
        members: club.memberCount,
      })),
    [clubs],
  );

  async function handleJoin(clubId: string) {
    if (!joinStudentId.trim()) return;
    setActionId(clubId);
    setError(null);
    try {
      await apiFetch(`/operations/clubs/join/${clubId}`, {
        method: 'POST',
        body: JSON.stringify({ studentId: joinStudentId.trim() }),
      });
      setJoinStudentId('');
      await loadClubs();
      if (selectedClubId === clubId) {
        await loadMembers(clubId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join club');
    } finally {
      setActionId(null);
    }
  }

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Clubs & Activities</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Club memberships, join/leave management, and activity log
            </p>
          </div>
          <Button variant="ghost" onClick={() => void loadClubs()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiBentoCard label="Active Clubs" value={loading ? '…' : clubs.length} icon={Crown} />
          <KpiBentoCard
            label="Total Members"
            value={loading ? '…' : clubs.reduce((sum, c) => sum + c.memberCount, 0)}
            icon={Users}
          />
          <KpiBentoCard
            label="Avg Fill Rate"
            value={
              loading || clubs.length === 0
                ? '…'
                : `${Math.round(
                    clubs.reduce((sum, c) => sum + clubMembershipPct(c), 0) / clubs.length,
                  )}%`
            }
            icon={Sparkles}
          />
          <KpiBentoCard label="Categories" value={loading ? '…' : new Set(clubs.map((c) => c.category)).size} icon={CalendarDays} />
        </div>

        {error && (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clubs.map((club) => (
            <div
              key={club.id}
              className={`bento-card cursor-pointer transition-shadow hover:shadow-card ${
                club.id === selectedClubId ? 'ring-2 ring-secondary' : ''
              }`}
              onClick={() => setSelectedClubId(club.id)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedClubId(club.id)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-title-md font-semibold text-on-surface">{club.name}</h3>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-label-md ${clubCategoryClass(club.category)}`}
                  >
                    {club.category}
                  </span>
                </div>
                <Badge variant={club.memberCount >= club.maxMembers ? 'warning' : 'success'}>
                  {club.memberCount}/{club.maxMembers}
                </Badge>
              </div>

              {club.advisor && (
                <p className="mt-3 text-body-md text-on-surface-variant">
                  Advisor: {club.advisor.firstName} {club.advisor.lastName}
                </p>
              )}

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-faint">
                <div
                  className="h-full rounded-full bg-secondary transition-all"
                  style={{ width: `${clubMembershipPct(club)}%` }}
                />
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={club.id === selectedClubId ? joinStudentId : ''}
                  onChange={(e) => {
                    setSelectedClubId(club.id);
                    setJoinStudentId(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Student ID to join"
                  className="h-9 flex-1 rounded-lg border border-gray-300/30 bg-surface-faint px-3 text-body-md"
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={actionId === club.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleJoin(club.id);
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bento-card">
            <h3 className="mb-4 text-title-lg font-semibold text-on-surface">
              {selectedClub ? `${selectedClub.name} — Members` : 'Club Members'}
            </h3>
            {membersLoading ? (
              <p className="text-body-md text-on-surface-variant">Loading members…</p>
            ) : members.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">No members yet</p>
            ) : (
              <ul className="space-y-2">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between rounded-lg bg-surface-faint px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-on-surface">
                        {studentDisplayName(member.student)}
                      </p>
                      <p className="text-label-md text-on-surface-variant">
                        {member.student.admissionNo} · Joined {formatShortDate(member.joinedAt)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" disabled title="Leave API pending">
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bento-card">
            <h3 className="mb-4 text-title-lg font-semibold text-on-surface">Activity Log</h3>
            <ul className="space-y-3">
              {activityLog.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 border-b border-gray-300/10 pb-3 last:border-0">
                  <Badge variant="outline">{entry.action}</Badge>
                  <div>
                    <p className="text-body-md font-medium text-on-surface">{entry.detail}</p>
                    <p className="text-label-md text-on-surface-variant">
                      {entry.clubName} · {formatRelativeTime(entry.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
              {activityLog.length === 0 && (
                <p className="text-body-md text-on-surface-variant">No recent activity</p>
              )}
            </ul>
          </div>
        </div>

        <div className="bento-card">
          <h3 className="mb-4 text-title-lg font-semibold text-on-surface">
            Membership by Club
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={membershipChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dce9ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="members" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
