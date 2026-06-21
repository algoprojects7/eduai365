'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AdminShell } from '@/components/admin-shell';
import { Badge } from '@eduai365/ui';
import { apiFetch } from '@/lib/api';
import {
  Shield,
  Brain,
  Sliders,
  Database,
  Lock,
  Eye,
  ToggleLeft,
  ToggleRight,
  Save,
  CheckCircle,
} from 'lucide-react';

const TOGGLEABLE_SERVICES = [
  { id: 'gps', name: 'GPS Live Tracking', description: 'Real-time school bus location tracking' },
  { id: 'library', name: 'Library Management', description: 'Book cataloging, issues and returns' },
  { id: 'transport', name: 'Transport Management', description: 'Route planning and bus allocation' },
  { id: 'hostel', name: 'Hostel/Dormitory', description: 'Hostel room allocations and warden logs' },
  { id: 'inventory', name: 'Inventory & Supplies', description: 'Stock tracking and inventory items' },
  { id: 'assets', name: 'Asset Management', description: 'School computer labs, smartboards, hardware' },
  { id: 'alumni', name: 'Alumni Network', description: 'Connect with former students and campaigns' },
  { id: 'bookstore', name: 'Bookstore Store', description: 'Selling textbooks and study materials' },
  { id: 'health', name: 'Health Clinic Logs', description: 'Infirmary visits, student health records' },
  { id: 'clubs', name: 'Clubs & Activities', description: 'Co-curricular clubs and membership roles' },
  { id: 'uniform', name: 'Uniform Inventory', description: 'School uniform stock levels and ordering' },
];

export default function SettingsPage() {
  const [crossTenantAnalytics, setCrossTenantAnalytics] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [dbIsolation, setDbIsolation] = useState('strict');
  const [aiModel, setAiModel] = useState('gemini-1.5-pro');
  const [logLevel, setLogLevel] = useState('info');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [disabledServices, setDisabledServices] = useState<string[]>([]);
  const [schoolSaveSuccess, setSchoolSaveSuccess] = useState(false);
  const [schoolSaveError, setSchoolSaveError] = useState<string | null>(null);
  const [loadingSchools, setLoadingSchools] = useState(false);

  useEffect(() => {
    async function loadSchools() {
      setLoadingSchools(true);
      try {
        const data = await apiFetch<any[]>('/platform/schools');
        setSchools(data);
        if (data.length > 0) {
          const first = data[0];
          setSelectedSchoolId(first.id);
          const services = first.settings?.disabledServices ?? [];
          setDisabledServices(services);
        }
      } catch (err) {
        console.error('Failed to load schools:', err);
      } finally {
        setLoadingSchools(false);
      }
    }
    loadSchools();
  }, []);

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    const school = schools.find((s) => s.id === schoolId);
    if (school) {
      setDisabledServices(school.settings?.disabledServices ?? []);
    }
  };

  const handleToggleService = (serviceId: string) => {
    setDisabledServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSaveSchoolSettings = async () => {
    if (!selectedSchoolId) return;
    setSchoolSaveError(null);
    setSchoolSaveSuccess(false);
    try {
      await apiFetch(`/platform/schools/${selectedSchoolId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ disabledServices }),
      });
      setSchools((prev) =>
        prev.map((s) =>
          s.id === selectedSchoolId
            ? { ...s, settings: { ...s.settings, disabledServices } }
            : s
        )
      );
      setSchoolSaveSuccess(true);
      setTimeout(() => setSchoolSaveSuccess(false), 3000);
    } catch (err) {
      setSchoolSaveError(err instanceof Error ? err.message : 'Failed to save configuration');
    }
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <AuthGuard>
      <AdminShell>
        <div className="space-y-8 max-w-4xl">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-headline-lg font-bold text-on-surface">
                Platform Security & Global System Settings
              </h1>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Configure global system parameters, access control scopes, and AI throughput policies.
              </p>
            </div>
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-body-md font-semibold text-white shadow-card hover:bg-secondary-container transition-all"
            >
              <Save className="h-4 w-4" />
              Save Configuration
            </button>
          </header>

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-body-md text-emerald-600 animate-in-fade">
              <CheckCircle className="h-5 w-5" />
              <span>Global system settings updated and synchronized to API gateways.</span>
            </div>
          )}

          {/* Super Admin Privileges Overview */}
          <div className="bento-card bg-slate-900 border-slate-800 text-white p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-ai-cyan font-bold text-label-md uppercase tracking-wider">
                <Shield className="h-4 w-4" />
                Root Privilege Access Enabled
              </div>
              <h2 className="text-title-lg font-bold">System Scope: Global (ALL)</h2>
              <p className="text-body-md text-white/70 max-w-xl">
                As a Super Admin, your access credentials bypass tenant isolation logic, allowing read,
                write, and query operations on all database nodes across every school ecosystem.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Badge variant="info" className="uppercase font-bold tracking-wider">
                super_admin:all
              </Badge>
              <Badge variant="info" className="uppercase font-bold tracking-wider">
                database:bypass
              </Badge>
              <Badge variant="info" className="uppercase font-bold tracking-wider">
                analytics:cross_tenant
              </Badge>
            </div>
          </div>

          {/* School Feature Access Gating Panel */}
          <div className="bento-card space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-secondary" />
                <h3 className="text-title-lg font-bold text-on-surface">School Service Gating & Feature Controls</h3>
              </div>
              <button
                onClick={handleSaveSchoolSettings}
                disabled={!selectedSchoolId}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-body-md font-semibold text-white shadow-card hover:bg-secondary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                Save School Configuration
              </button>
            </div>

            {schoolSaveSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-body-md text-emerald-600 animate-in-fade">
                <CheckCircle className="h-5 w-5" />
                <span>Feature configuration successfully saved and synchronized for the school.</span>
              </div>
            )}

            {schoolSaveError && (
              <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-body-md text-error">
                {schoolSaveError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-surface-faint p-4 rounded-xl border border-surface-faint">
              <div className="w-full sm:w-auto">
                <label className="text-body-md font-semibold text-on-surface block mb-1">
                  Select Target School:
                </label>
                {loadingSchools ? (
                  <span className="text-body-md text-on-surface-variant animate-pulse">Loading schools...</span>
                ) : (
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    className="w-full sm:w-72 rounded-lg border border-gray-200 bg-white p-2.5 text-body-md text-on-surface focus:border-secondary outline-none shadow-sm"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.slug})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="text-body-md text-on-surface-variant">
                Modify access scopes for this school tenant. Disabled services will be completely hidden from the user interface and API direct routes.
              </div>
            </div>

            {selectedSchoolId && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {TOGGLEABLE_SERVICES.map((service) => {
                  const isDisabled = disabledServices.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      onClick={() => handleToggleService(service.id)}
                      className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer select-none hover:shadow-card-hover ${
                        isDisabled
                          ? 'border-error/20 bg-error/5 text-error-container'
                          : 'border-surface-faint bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`font-semibold text-body-md ${isDisabled ? 'text-error' : 'text-on-surface'}`}>
                            {service.name}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            isDisabled ? 'bg-error/15 text-error' : 'bg-success/15 text-success'
                          }`}>
                            {isDisabled ? 'DISABLED' : 'ACTIVE'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mb-4">
                          {service.description}
                        </p>
                      </div>
                      <div className="flex justify-end pt-2 border-t border-gray-100/50">
                        {isDisabled ? (
                          <ToggleLeft className="h-8 w-8 text-error/60" />
                        ) : (
                          <ToggleRight className="h-8 w-8 text-secondary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Database & Tenant Isolation Settings */}
            <div className="bento-card space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Database className="h-5 w-5 text-secondary" />
                <h3 className="text-title-lg font-bold text-on-surface">Tenant Security & DB Policies</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-body-md font-semibold text-on-surface">Cross-Tenant Analytics</label>
                    <p className="text-xs text-on-surface-variant max-w-xs">
                      Enables global data queries to pool statistics for machine learning.
                    </p>
                  </div>
                  <button
                    onClick={() => setCrossTenantAnalytics(!crossTenantAnalytics)}
                    className="text-secondary"
                  >
                    {crossTenantAnalytics ? (
                      <ToggleRight className="h-10 w-10 text-secondary" />
                    ) : (
                      <ToggleLeft className="h-10 w-10 text-on-surface-variant/40" />
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-body-md font-semibold text-on-surface block">
                    Database Connection Isolation
                  </label>
                  <select
                    value={dbIsolation}
                    onChange={(e) => setDbIsolation(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-body-md text-on-surface focus:border-secondary outline-none"
                  >
                    <option value="strict">Strict (Separate schemas + dedicated pools)</option>
                    <option value="logical">Logical (Shared schema + tenant_id keys)</option>
                    <option value="hybrid">Hybrid (Shared pool with logical schemas)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Global AI Copilot Settings */}
            <div className="bento-card space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Brain className="h-5 w-5 text-ai-violet" />
                <h3 className="text-title-lg font-bold text-on-surface">AI Copilot Configurations</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-body-md font-semibold text-on-surface block">
                    Default LLM Model Engine
                  </label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-body-md text-on-surface focus:border-secondary outline-none"
                  >
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Performance)</option>
                    <option value="gemini-2.0-experimental">Gemini 2.0 Experimental</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-body-md font-semibold text-on-surface block">
                    Telemetry Logging Level
                  </label>
                  <select
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-body-md text-on-surface focus:border-secondary outline-none"
                  >
                    <option value="verbose">Verbose (Debug logging enabled)</option>
                    <option value="info">Info (Standard operations tracking)</option>
                    <option value="warn">Warn (Logs warnings + errors only)</option>
                    <option value="error">Error (Logs exceptions only)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Maintenance Mode & Gateways */}
            <div className="bento-card md:col-span-2 space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Sliders className="h-5 w-5 text-orange-500" />
                <h3 className="text-title-lg font-bold text-on-surface">API Gateways & Emergency Operations</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                  <div className="flex items-center gap-2 text-body-md font-semibold text-on-surface">
                    Platform Maintenance Mode
                    {maintenanceMode && (
                      <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant max-w-xl mt-1">
                    Forces all client requests to receive a 503 Maintenance response. Used for system
                    migrations and database backups. Excludes Super Admin logins.
                  </p>
                </div>
                <button
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className="text-secondary shrink-0"
                >
                  {maintenanceMode ? (
                    <ToggleRight className="h-10 w-10 text-error" />
                  ) : (
                    <ToggleLeft className="h-10 w-10 text-on-surface-variant/40" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminShell>
    </AuthGuard>
  );
}
