'use client';

import { Badge } from '@eduai365/ui';
import { Activity, Database, Server, Zap } from 'lucide-react';
import { formatUptime } from '@/lib/format';
import type { SystemHealth } from '@/types/platform';

interface SystemHealthWidgetsProps {
  health: SystemHealth;
}

function systemLoadPercent(health: SystemHealth): number {
  const latencyScore = Math.min(100, Math.round((health.apiLatencyMs / 120) * 100));
  const dbScore = Math.min(100, Math.round((health.dbLagMs / 50) * 100));
  return Math.max(55, Math.min(95, 100 - Math.round((latencyScore + dbScore) / 4)));
}

export function SystemLoadWidget({ health }: SystemHealthWidgetsProps) {
  const load = systemLoadPercent(health);
  const status = load <= 85 ? 'OPTIMAL' : load <= 92 ? 'ELEVATED' : 'CRITICAL';
  const statusColor =
    status === 'OPTIMAL' ? 'text-success' : status === 'ELEVATED' ? 'text-warning' : 'text-error';

  return (
    <div className="bento-card flex h-full flex-col justify-between">
      <div>
        <h3 className="text-title-lg font-semibold text-on-surface">System Load</h3>
        <p className="text-body-md text-on-surface-variant">Active server node efficiency</p>
      </div>
      <div className="my-6 text-center">
        <p className="text-display-lg font-bold tabular-nums text-on-surface">{load}%</p>
        <p className={`mt-1 text-label-md font-semibold tracking-wider ${statusColor}`}>{status}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-faint">
        <div
          className="h-full rounded-full bg-ai-gradient transition-all"
          style={{ width: `${load}%` }}
        />
      </div>
    </div>
  );
}

export function SystemHealthWidgets({ health }: SystemHealthWidgetsProps) {
  const dependencyEntries = Object.entries(health.dependencies ?? {});

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-title-lg font-semibold text-on-surface">System Health</h3>
        <p className="text-body-md text-on-surface-variant">Platform infrastructure telemetry</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bento-card">
          <div className="mb-3 flex items-center gap-2 text-on-surface-variant">
            <Activity className="h-4 w-4" />
            <span className="text-label-md uppercase tracking-wider">Status</span>
          </div>
          <Badge variant={health.status === 'healthy' ? 'success' : 'warning'}>
            {health.status === 'healthy' ? 'Healthy' : 'Degraded'}
          </Badge>
        </div>

        <div className="bento-card">
          <div className="mb-3 flex items-center gap-2 text-on-surface-variant">
            <Server className="h-4 w-4" />
            <span className="text-label-md uppercase tracking-wider">Uptime</span>
          </div>
          <p className="text-headline-md font-bold tabular-nums">{formatUptime(health.uptime)}</p>
        </div>

        <div className="bento-card">
          <div className="mb-3 flex items-center gap-2 text-on-surface-variant">
            <Database className="h-4 w-4" />
            <span className="text-label-md uppercase tracking-wider">DB Latency</span>
          </div>
          <p className="text-headline-md font-bold tabular-nums">{health.dbLagMs}ms</p>
        </div>

        <div className="bento-card">
          <div className="mb-3 flex items-center gap-2 text-on-surface-variant">
            <Zap className="h-4 w-4" />
            <span className="text-label-md uppercase tracking-wider">API Latency</span>
          </div>
          <p className="text-headline-md font-bold tabular-nums">{health.apiLatencyMs}ms</p>
        </div>
      </div>

      {dependencyEntries.length > 0 && (
        <div className="bento-card">
          <p className="mb-3 text-label-md uppercase tracking-wider text-on-surface-variant">
            Dependencies
          </p>
          <div className="flex flex-wrap gap-2">
            {dependencyEntries.map(([name, dep]) => (
              <Badge
                key={name}
                variant={dep.status === 'up' || dep.status === 'ok' ? 'success' : 'warning'}
              >
                {name}: {dep.status}
                {dep.latencyMs != null ? ` (${dep.latencyMs}ms)` : ''}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
