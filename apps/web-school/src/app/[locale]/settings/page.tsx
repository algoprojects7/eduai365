'use client';

import { useEffect, useState, useRef } from 'react';
import { Button, KpiBentoCard, TabGroup } from '@eduai365/ui';
import {
  BedDouble,
  BookOpen,
  Boxes,
  Bus,
  CheckCircle2,
  HardDrive,
  HeartPulse,
  Info,
  Library,
  Lock,
  MapPin,
  Network,
  Package,
  Plug,
  Save,
  School,
  Shield,
  ShoppingBag,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Users,
  XCircle,
  Plus,
  Trash2,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import type { SchoolProfile, UpdateSchoolProfileInput } from '@/types/school';

type SettingsTab = 'branding' | 'services' | 'general' | 'subjects';

const ALL_SERVICES = [
  {
    id: 'gps',
    name: 'GPS Live Tracking',
    description: 'Real-time school bus location tracking for parents and staff',
    icon: MapPin,
    category: 'Operations',
  },
  {
    id: 'library',
    name: 'Library Management',
    description: 'Book cataloging, issues and returns tracking',
    icon: Library,
    category: 'Operations',
  },
  {
    id: 'transport',
    name: 'Transport Management',
    description: 'Route planning and bus allocation',
    icon: Bus,
    category: 'Operations',
  },
  {
    id: 'health',
    name: 'Health Clinic Logs',
    description: 'Infirmary visits and student health records',
    icon: HeartPulse,
    category: 'Operations',
  },
  {
    id: 'clubs',
    name: 'Clubs & Activities',
    description: 'Co-curricular clubs and membership roles',
    icon: Users,
    category: 'Operations',
  },
  {
    id: 'bookstore',
    name: 'Bookstore',
    description: 'Selling textbooks and study materials',
    icon: ShoppingBag,
    category: 'Operations',
  },
  {
    id: 'uniform',
    name: 'Uniform Inventory',
    description: 'School uniform stock levels and ordering',
    icon: Package,
    category: 'Operations',
  },
  {
    id: 'hostel',
    name: 'Hostel / Dormitory',
    description: 'Hostel room allocations and warden logs',
    icon: BedDouble,
    category: 'Extended',
  },
  {
    id: 'inventory',
    name: 'Inventory & Supplies',
    description: 'Stock tracking and inventory items',
    icon: Boxes,
    category: 'Extended',
  },
  {
    id: 'assets',
    name: 'Asset Management',
    description: 'School computer labs, smartboards, hardware',
    icon: HardDrive,
    category: 'Extended',
  },
  {
    id: 'alumni',
    name: 'Alumni Network',
    description: 'Connect with former students and campaigns',
    icon: Network,
    category: 'Extended',
  },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [form, setForm] = useState<UpdateSchoolProfileInput>({
    name: '',
    logoUrl: '',
    primaryColor: '#0052d2',
  });
  const [activeTab, setActiveTab] = useState<SettingsTab>('branding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [principalRestrictedModules, setPrincipalRestrictedModules] = useState<string[]>([]);
  const [sessionEndingMonth, setSessionEndingMonth] = useState<string>('March');
  const [admissionFeeCategories, setAdmissionFeeCategories] = useState<string[]>([]);
  const [monthlyFeeCategories, setMonthlyFeeCategories] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await apiFetch<SchoolProfile>('/school/profile');
        if (!cancelled) {
          setProfile(data);
          setForm({
            name: data.name,
            logoUrl: data.logoUrl ?? '',
            primaryColor: data.primaryColor ?? '#0052d2',
          });
          setPrincipalRestrictedModules(data.settings?.principalRestrictedModules ?? []);
          setSessionEndingMonth(data.settings?.sessionEndingMonth ?? 'March');
          setAdmissionFeeCategories(data.settings?.admissionFeeCategories ?? []);
          setMonthlyFeeCategories(data.settings?.monthlyFeeCategories ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load school profile');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const updated = await apiFetch<SchoolProfile>('/school/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          logoUrl: form.logoUrl || null,
          primaryColor: form.primaryColor || null,
        }),
      });
      setProfile(updated);
      setSuccess('School branding updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveServices() {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const updated = await apiFetch<SchoolProfile>('/school/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          principalRestrictedModules,
        }),
      });
      setProfile(updated);
      setPrincipalRestrictedModules(updated.settings?.principalRestrictedModules ?? []);
      setSuccess('Service access controls updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service permissions');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveGeneral(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const updated = await apiFetch<SchoolProfile>('/school/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          sessionEndingMonth,
          admissionFeeCategories,
          monthlyFeeCategories,
        }),
      });
      setProfile(updated);
      setSessionEndingMonth(updated.settings?.sessionEndingMonth ?? 'March');
      setAdmissionFeeCategories(updated.settings?.admissionFeeCategories ?? []);
      setMonthlyFeeCategories(updated.settings?.monthlyFeeCategories ?? []);
      setSuccess('General settings updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update general settings');
    } finally {
      setSaving(false);
    }
  }

  const disabledServices = profile?.settings?.disabledServices ?? [];
  const platformRestrictedCount = ALL_SERVICES.filter((s) => disabledServices.includes(s.id)).length;
  const schoolRestrictedCount = ALL_SERVICES.filter((s) => !disabledServices.includes(s.id) && principalRestrictedModules.includes(s.id)).length;
  const activeCount = ALL_SERVICES.filter((s) => !disabledServices.includes(s.id) && !principalRestrictedModules.includes(s.id)).length;

  const operationsServices = ALL_SERVICES.filter((s) => s.category === 'Operations');
  const extendedServices = ALL_SERVICES.filter((s) => s.category === 'Extended');

  return (
    <SchoolShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Settings</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Configure school branding and manage tenant settings
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiBentoCard
            label="School Name"
            value={loading ? '…' : (profile?.name ?? '—')}
            icon={School}
          />
          <KpiBentoCard
            label="Active Modules"
            value={loading ? '…' : String(activeCount)}
            icon={CheckCircle2}
          />
          <KpiBentoCard
            label="Restricted Modules"
            value={loading ? '…' : String(schoolRestrictedCount + platformRestrictedCount)}
            icon={Lock}
          />
        </div>

        <TabGroup
          tabs={[
            { id: 'branding', label: 'Branding' },
            { id: 'services', label: 'Services & Modules' },
            { id: 'general', label: 'General' },
            { id: 'subjects', label: 'Subjects' },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as SettingsTab)}
        />

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading settings…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {success && (
          <div className="rounded-lg bg-success/10 px-4 py-3 text-body-md text-success">
            {success}
          </div>
        )}

        {/* ─── Branding Tab ─────────────────────────────────────────────────── */}
        {!loading && activeTab === 'branding' && (
          <form onSubmit={handleSubmit} className="bento-card space-y-5">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                School Name
              </label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>

            <div>
              <label htmlFor="logoUrl" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                Logo URL
              </label>
              <input
                id="logoUrl"
                type="url"
                value={form.logoUrl ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>

            <div>
              <label htmlFor="primaryColor" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="primaryColor"
                  type="color"
                  value={form.primaryColor ?? '#0052d2'}
                  onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-gray-300/30 bg-white"
                />
                <input
                  type="text"
                  value={form.primaryColor ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="h-11 flex-1 rounded-lg border border-gray-300/30 bg-surface-faint px-4 font-mono text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="slug" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                Tenant Slug
              </label>
              <input
                id="slug"
                readOnly
                value={profile?.slug ?? ''}
                className="h-11 w-full cursor-not-allowed rounded-lg border border-gray-300/20 bg-surface-faint/50 px-4 font-mono text-body-md text-on-surface-variant"
              />
              <p className="mt-1 text-label-md text-on-surface-variant">
                Slug is read-only and used for tenant routing
              </p>
            </div>

            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save Branding'}
            </Button>
          </form>
        )}

        {/* ─── Services & Modules Tab ───────────────────────────────────────── */}
        {!loading && activeTab === 'services' && (
          <div className="space-y-5">
            {/* Info notice */}
            <div className="flex items-start gap-3 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <div>
                <p className="text-body-md font-semibold text-on-surface">
                  Service Gating & Role Restrictions
                </p>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">
                  Configure school-internal access. When a module is set to <strong>School Restricted</strong>, other users (such as Teachers, Students, HR, and Librarians) will not be able to access the module or see it in their sidebar navigation. Administrators, Principals, and Vice Principals always retain access.
                </p>
              </div>
            </div>

            {/* Summary pills */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-label-md font-semibold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {activeCount} Active
              </span>
              {schoolRestrictedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-label-md font-semibold text-orange-600">
                  <XCircle className="h-3.5 w-3.5" />
                  {schoolRestrictedCount} School Restricted
                </span>
              )}
              {platformRestrictedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-error/10 px-3 py-1 text-label-md font-semibold text-error">
                  <Lock className="h-3.5 w-3.5" />
                  {platformRestrictedCount} Platform Restricted
                </span>
              )}
            </div>

            {/* Operations Services */}
            <div className="bento-card space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Sliders className="h-4 w-4 text-secondary" />
                <h2 className="text-title-md font-bold text-on-surface">Operations</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {operationsServices.map((service) => {
                  const isPlatformRestricted = disabledServices.includes(service.id);
                  const isSchoolRestricted = principalRestrictedModules.includes(service.id);
                  const Icon = service.icon;

                  return (
                    <div
                      key={service.id}
                      onClick={() => {
                        if (isPlatformRestricted) return;
                        setPrincipalRestrictedModules((prev) =>
                          prev.includes(service.id)
                            ? prev.filter((id) => id !== service.id)
                            : [...prev, service.id]
                        );
                      }}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all select-none ${
                        isPlatformRestricted
                          ? 'border-gray-200/50 bg-gray-50/50 opacity-60 cursor-not-allowed'
                          : isSchoolRestricted
                          ? 'border-orange-200 bg-orange-50/30 cursor-pointer hover:border-orange-300 shadow-sm'
                          : 'border-surface-faint bg-white cursor-pointer hover:border-secondary/30 hover:shadow-sm'
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isPlatformRestricted
                            ? 'bg-gray-100 text-gray-400'
                            : isSchoolRestricted
                            ? 'bg-orange-100 text-orange-500'
                            : 'bg-secondary/10 text-secondary'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-body-md font-semibold ${
                              isPlatformRestricted
                                ? 'text-gray-400'
                                : isSchoolRestricted
                                ? 'text-orange-950'
                                : 'text-on-surface'
                            }`}
                          >
                            {service.name}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isPlatformRestricted
                                ? 'bg-gray-150 text-gray-600'
                                : isSchoolRestricted
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-success/15 text-success'
                            }`}
                          >
                            {isPlatformRestricted
                              ? 'PLATFORM RESTRICTED'
                              : isSchoolRestricted
                              ? 'SCHOOL RESTRICTED'
                              : 'ACTIVE'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-2">
                          {service.description}
                        </p>
                        
                        {!isPlatformRestricted && (
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100/50">
                            <span className="text-[10px] text-on-surface-variant font-medium">
                              {isSchoolRestricted ? 'Restricted' : 'Accessible'}
                            </span>
                            {isSchoolRestricted ? (
                              <ToggleLeft className="h-6 w-6 text-orange-400 hover:text-orange-500 transition-colors" />
                            ) : (
                              <ToggleRight className="h-6 w-6 text-secondary hover:text-secondary-container transition-colors" />
                            )}
                          </div>
                        )}
                        {isPlatformRestricted && (
                          <div className="flex items-center gap-1 pt-2 mt-2 border-t border-gray-100/30 text-[10px] text-gray-400">
                            <Lock className="h-3 w-3" />
                            <span>Disabled by Platform Super Admin</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extended Services */}
            <div className="bento-card space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <BookOpen className="h-4 w-4 text-secondary" />
                <h2 className="text-title-md font-bold text-on-surface">Extended Modules</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {extendedServices.map((service) => {
                  const isPlatformRestricted = disabledServices.includes(service.id);
                  const isSchoolRestricted = principalRestrictedModules.includes(service.id);
                  const Icon = service.icon;

                  return (
                    <div
                      key={service.id}
                      onClick={() => {
                        if (isPlatformRestricted) return;
                        setPrincipalRestrictedModules((prev) =>
                          prev.includes(service.id)
                            ? prev.filter((id) => id !== service.id)
                            : [...prev, service.id]
                        );
                      }}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all select-none ${
                        isPlatformRestricted
                          ? 'border-gray-200/50 bg-gray-50/50 opacity-60 cursor-not-allowed'
                          : isSchoolRestricted
                          ? 'border-orange-200 bg-orange-50/30 cursor-pointer hover:border-orange-300 shadow-sm'
                          : 'border-surface-faint bg-white cursor-pointer hover:border-secondary/30 hover:shadow-sm'
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isPlatformRestricted
                            ? 'bg-gray-100 text-gray-400'
                            : isSchoolRestricted
                            ? 'bg-orange-100 text-orange-500'
                            : 'bg-secondary/10 text-secondary'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-body-md font-semibold ${
                              isPlatformRestricted
                                ? 'text-gray-400'
                                : isSchoolRestricted
                                ? 'text-orange-955'
                                : 'text-on-surface'
                            }`}
                          >
                            {service.name}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isPlatformRestricted
                                ? 'bg-gray-150 text-gray-600'
                                : isSchoolRestricted
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-success/15 text-success'
                            }`}
                          >
                            {isPlatformRestricted
                              ? 'PLATFORM RESTRICTED'
                              : isSchoolRestricted
                              ? 'SCHOOL RESTRICTED'
                              : 'ACTIVE'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-2">
                          {service.description}
                        </p>
                        
                        {!isPlatformRestricted && (
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100/50">
                            <span className="text-[10px] text-on-surface-variant font-medium">
                              {isSchoolRestricted ? 'Restricted' : 'Accessible'}
                            </span>
                            {isSchoolRestricted ? (
                              <ToggleLeft className="h-6 w-6 text-orange-400 hover:text-orange-500 transition-colors" />
                            ) : (
                              <ToggleRight className="h-6 w-6 text-secondary hover:text-secondary-container transition-colors" />
                            )}
                          </div>
                        )}
                        {isPlatformRestricted && (
                          <div className="flex items-center gap-1 pt-2 mt-2 border-t border-gray-100/30 text-[10px] text-gray-400">
                            <Lock className="h-3 w-3" />
                            <span>Disabled by Platform Super Admin</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end pt-3">
              <Button onClick={handleSaveServices} variant="primary" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving…' : 'Save Service Settings'}
              </Button>
            </div>
          </div>
        )}

        {/* ─── General Tab ─────────────────────────────────────────────────── */}
        {!loading && activeTab === 'general' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveGeneral} className="bento-card space-y-5">
              <div className="border-b border-gray-150/30 pb-3 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-secondary" />
                <h2 className="text-title-md font-bold text-on-surface">Academic Session & Fee Settings</h2>
              </div>

              <div>
                <label htmlFor="sessionEndingMonth" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                  Session Ending Month
                </label>
                <select
                  id="sessionEndingMonth"
                  value={sessionEndingMonth}
                  onChange={(e) => setSessionEndingMonth(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                >
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-label-md text-on-surface-variant">
                  Used to determine when the active academic session closes. Parents are alerted and payment links are updated when the session is over.
                </p>
              </div>

              <div>
                <label htmlFor="admissionFeeCategories" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                  Admission Fee Categories (comma separated)
                </label>
                <input
                  id="admissionFeeCategories"
                  type="text"
                  value={admissionFeeCategories.join(', ')}
                  onChange={(e) => setAdmissionFeeCategories(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  placeholder="e.g. Admission Fee, Security Deposit"
                  className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
                <p className="mt-1.5 text-label-md text-on-surface-variant">
                  Define the categories applied for new admissions (e.g., Admission Fee, Security Deposit).
                </p>
              </div>

              <div>
                <label htmlFor="monthlyFeeCategories" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                  Monthly Fee Categories (comma separated)
                </label>
                <input
                  id="monthlyFeeCategories"
                  type="text"
                  value={monthlyFeeCategories.join(', ')}
                  onChange={(e) => setMonthlyFeeCategories(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  placeholder="e.g. Tuition Fee, Transport Fee, Lab Fee"
                  className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
                <p className="mt-1.5 text-label-md text-on-surface-variant">
                  Define the categories applied for monthly fees (e.g., Tuition Fee, Transport Fee).
                </p>
              </div>

              <Button type="submit" variant="primary" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving…' : 'Save General Settings'}
              </Button>
            </form>

            <Link
              href="/settings/integrations"
              className="bento-card flex items-start gap-4 transition-colors hover:border-secondary/40"
            >
              <div className="rounded-lg bg-secondary/10 p-3">
                <Plug className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <h2 className="text-title-md font-semibold text-on-surface">Integrations</h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Payment webhooks, QR attendance scanner, and SMS/WhatsApp test sends
                </p>
              </div>
            </Link>

            <Link
              href="/settings/privacy"
              className="bento-card flex items-start gap-4 transition-colors hover:border-secondary/40"
            >
              <div className="rounded-lg bg-secondary/10 p-3">
                <Shield className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <h2 className="text-title-md font-semibold text-on-surface">Privacy &amp; Data</h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Consent preferences, data export, and account deletion (DPDPA/GDPR)
                </p>
              </div>
            </Link>

            <div className="bento-card space-y-3 text-body-md text-on-surface-variant">
              <p>
                General school settings such as academic year, timezone, and notification preferences
                will be available in a future release.
              </p>
              <p>
                Current tenant: <span className="font-mono text-on-surface">{profile?.slug}</span>
              </p>
            </div>
          </div>
        )}
        {/* ─── Subjects Tab ─────────────────────────────────────────────────── */}
        {!loading && activeTab === 'subjects' && <SubjectConfigurationTab />}

      </div>
    </SchoolShell>
  );
}

function SubjectConfigurationTab() {
  const [session, setSession] = useState('2025-2026');
  const [selectedClass, setSelectedClass] = useState('Class X');
  const [language, setLanguage] = useState<'en' | 'as'>('en');
  const [subjects, setSubjects] = useState<{ id: string; name: string; maxMarks: number | '' }[]>([{ id: Date.now().toString(), name: '', maxMarks: 100 }]);
  const [savedSubjects, setSavedSubjects] = useState<{ id: string; name: string; maxMarks: number }[]>([]);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectData, setEditingSubjectData] = useState<{ name: string; maxMarks: number | '' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: string, text: string}>({ type: '', text: '' });

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res: any = await apiFetch(`/academics/subjects?session=${encodeURIComponent(session)}&className=${encodeURIComponent(selectedClass)}`);
        if (Array.isArray(res)) {
          setSavedSubjects(res);
        }
      } catch (err) {
        console.error('Failed to fetch subjects', err);
      }
    };
    fetchSubjects();
  }, [session, selectedClass]);

  const classOptions = ['Nursery', 'KG', 'Class I', 'Class II', 'Class III', 'Class IV', 'Class V', 'Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X', 'Class XI', 'Class XII'];

  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now().toString(), name: '', maxMarks: 100 }]);
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const updateSubject = (id: string, field: 'name' | 'maxMarks', value: string | number) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    // Client-side duplication check
    const names = new Set<string>();
    const validSubjects = subjects.filter(s => s.name.trim() !== '');
    for (const sub of validSubjects) {
      const nameLower = sub.name.trim().toLowerCase();
      if (names.has(nameLower)) {
        setMessage({ type: 'error', text: `Duplicate subject in list: ${sub.name}` });
        setSaving(false);
        return;
      }
      names.add(nameLower);
    }

    try {
      await apiFetch('/academics/subjects/batch', {
        method: 'POST',
        body: JSON.stringify({
          session,
          className: selectedClass,
          language,
          subjects: subjects.filter(s => s.name.trim() !== '').map(s => ({
            name: s.name,
            maxMarks: s.maxMarks === '' ? 100 : s.maxMarks
          }))
        })
      });
      setMessage({ type: 'success', text: 'Subjects configured successfully.' });
      setSubjects([{ id: Date.now().toString(), name: '', maxMarks: 100 }]);
      
      const res: any = await apiFetch(`/academics/subjects?session=${encodeURIComponent(session)}&className=${encodeURIComponent(selectedClass)}`);
      if (Array.isArray(res)) {
        setSavedSubjects(res);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save subjects' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      await apiFetch(`/academics/subjects/${id}`, { method: 'DELETE' });
      setSavedSubjects(savedSubjects.filter(s => s.id !== id));
      setMessage({ type: 'success', text: 'Subject deleted successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete subject' });
    }
  };

  const handleEditClick = (sub: { id: string; name: string; maxMarks: number }) => {
    setEditingSubjectId(sub.id);
    setEditingSubjectData({ name: sub.name, maxMarks: sub.maxMarks });
  };

  const handleEditCancel = () => {
    setEditingSubjectId(null);
    setEditingSubjectData(null);
  };

  const handleEditSave = async (id: string) => {
    if (!editingSubjectData || !editingSubjectData.name.trim()) return;
    try {
      await apiFetch(`/academics/subjects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editingSubjectData.name,
          maxMarks: editingSubjectData.maxMarks === '' ? 0 : editingSubjectData.maxMarks
        })
      });
      setSavedSubjects(savedSubjects.map(s => 
        s.id === id ? { ...s, name: editingSubjectData.name, maxMarks: editingSubjectData.maxMarks === '' ? 0 : editingSubjectData.maxMarks } : s
      ));
      setEditingSubjectId(null);
      setEditingSubjectData(null);
      setMessage({ type: 'success', text: 'Subject updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update subject' });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="bento-card space-y-5">
        <div className="border-b border-gray-150/30 pb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-secondary" />
          <h2 className="text-title-md font-bold text-on-surface">Subject Configuration</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-label-md font-medium text-on-surface-variant">Session</label>
            <input
              type="text"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="e.g. 2025-2026"
              required
              className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-label-md font-medium text-on-surface-variant">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-label-md font-medium text-on-surface-variant">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'as')}
              className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              <option value="en">English</option>
              <option value="as">Assamese</option>
            </select>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-label-md font-medium text-on-surface-variant">Subjects List</label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={addSubject}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Subject
              </Button>
            </div>
          </div>
          
          <div className="space-y-3 rounded-xl border border-gray-150/50 p-4 bg-gray-50/30">
            {subjects.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant text-center py-2">No subjects added. Click &quot;Add Subject&quot; to begin.</p>
            ) : (
              subjects.map((sub, index) => (
                <div key={sub.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      value={sub.name}
                      onChange={(e) => updateSubject(sub.id, 'name', e.target.value)}
                      placeholder={language === 'as' ? 'বিষয়ৰ নাম (যেনে: গণিত)' : 'Subject Name (e.g. Mathematics)'}
                      className="h-11 w-full rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <input
                      type="number"
                      required
                      min={1}
                      value={sub.maxMarks === '' ? '' : sub.maxMarks}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateSubject(sub.id, 'maxMarks', isNaN(val) ? '' : val);
                      }}
                      placeholder="Max Marks"
                      className="h-11 w-full rounded-lg border border-gray-300/30 bg-white px-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubject(sub.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-error hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          </div>
          
          <div className="pt-2 flex items-center justify-between">
            <div>
              {message.text && (
                <span className={`text-body-md font-medium ${message.type === 'success' ? 'text-success' : 'text-error'}`}>
                  {message.text}
                </span>
              )}
            </div>
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save Subjects'}
            </Button>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-4 lg:border-l lg:border-gray-150/50 lg:pl-6 space-y-4">
          <h3 className="text-label-md font-semibold text-on-surface">Saved Subjects</h3>
          <div className="space-y-2">
            {savedSubjects.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">No subjects saved yet for this class.</p>
            ) : (
              savedSubjects.map(sub => (
                <div key={sub.id} className="flex flex-col gap-2 text-body-sm bg-surface-faint rounded-md p-2.5 border border-gray-150/30">
                  {editingSubjectId === sub.id && editingSubjectData ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={editingSubjectData.name} 
                        onChange={e => setEditingSubjectData({ ...editingSubjectData, name: e.target.value })}
                        className="flex-1 h-8 rounded border border-gray-300/30 px-2 text-sm outline-none focus:border-secondary" 
                      />
                      <input 
                        type="number" 
                        value={editingSubjectData.maxMarks} 
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          setEditingSubjectData({ ...editingSubjectData, maxMarks: isNaN(val) ? '' : val });
                        }}
                        className="w-16 h-8 rounded border border-gray-300/30 px-2 text-sm outline-none focus:border-secondary" 
                      />
                      <Button variant="ghost" size="sm" onClick={handleEditCancel} className="h-8 px-2 text-on-surface-variant">Cancel</Button>
                      <Button variant="primary" size="sm" onClick={() => handleEditSave(sub.id)} className="h-8 px-2">Save</Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-medium truncate" title={sub.name}>{sub.name}</span>
                        <span className="text-on-surface-variant shrink-0 bg-gray-150/30 px-1.5 py-0.5 rounded text-xs">{sub.maxMarks} Marks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => handleEditClick(sub)} className="p-1.5 text-on-surface-variant hover:text-secondary rounded hover:bg-surface transition-colors" title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDeleteSubject(sub.id)} className="p-1.5 text-error hover:bg-red-50 rounded transition-colors" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {savedSubjects.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-150/30">
              <div className="flex justify-between text-label-sm font-semibold text-on-surface">
                <span>Total Subjects:</span>
                <span>{savedSubjects.length}</span>
              </div>
              <div className="flex justify-between text-label-sm font-medium mt-2 text-on-surface-variant">
                <span>Total Marks:</span>
                <span>{savedSubjects.reduce((acc, curr) => acc + (curr.maxMarks || 0), 0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      </form>
    </div>
  );
}
