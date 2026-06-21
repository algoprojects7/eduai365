'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, KpiBentoCard } from '@eduai365/ui';
import {
  AlertTriangle,
  Battery,
  Bell,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import { buildGpsMarkersFromRoutes, mergeLiveGpsWithMarkers } from '@/lib/operations';
import type {
  GeofenceAlert,
  GpsBusMarker,
  GpsLivePosition,
  TransportRoute,
} from '@/types/operations';

const GPS_POLL_MS = 5_000;

const MOCK_GEOFENCE_ALERTS: GeofenceAlert[] = [
  {
    id: '1',
    busNo: 'LAG-1234-AB',
    type: 'ENTRY',
    zone: 'School Campus',
    timestamp: new Date(Date.now() - 8 * 60_000).toISOString(),
  },
  {
    id: '2',
    busNo: 'LAG-5678-CD',
    type: 'EXIT',
    zone: 'Victoria Island Zone',
    timestamp: new Date(Date.now() - 22 * 60_000).toISOString(),
  },
];

export default function GpsTrackingPage() {
  const [markers, setMarkers] = useState<GpsBusMarker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panicSent, setPanicSent] = useState<string | null>(null);
  const [liveFeed, setLiveFeed] = useState(false);
  const [alerts] = useState(MOCK_GEOFENCE_ALERTS);
  const baseMarkersRef = useRef<GpsBusMarker[]>([]);

  const applyLivePositions = useCallback((positions: GpsLivePosition[]) => {
    const merged = mergeLiveGpsWithMarkers(positions, baseMarkersRef.current);
    setMarkers(merged);
    setLiveFeed(positions.length > 0);
    setSelectedId((prev) => prev ?? merged[0]?.id ?? null);
  }, []);

  const pollLiveGps = useCallback(async () => {
    try {
      const positions = await apiFetch<GpsLivePosition[]>('/integrations/gps/live');
      applyLivePositions(positions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load live GPS data');
    }
  }, [applyLivePositions]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const routes = await apiFetch<TransportRoute[]>('/operations/transport/routes');
      baseMarkersRef.current = buildGpsMarkersFromRoutes(routes);
      await pollLiveGps();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GPS data');
    } finally {
      setLoading(false);
    }
  }, [pollLiveGps]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await pollLiveGps();
    } finally {
      setRefreshing(false);
    }
  }, [pollLiveGps]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void pollLiveGps();
    }, GPS_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [pollLiveGps]);

  const selected = markers.find((m) => m.id === selectedId) ?? markers[0];
  const isBusy = loading || refreshing;

  function handlePanic(busId: string) {
    setPanicSent(busId);
    window.setTimeout(() => setPanicSent(null), 4000);
  }

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">GPS Live Tracking</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Live bus positions, geofence alerts, ETA, and panic response
              {liveFeed && (
                <span className="ml-2 inline-flex items-center gap-1 text-secondary">
                  <Radio className="h-3.5 w-3.5" />
                  Live feed · refreshes every 5s
                </span>
              )}
            </p>
          </div>
          <Button variant="ghost" onClick={() => void handleRefresh()} disabled={isBusy}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiBentoCard label="Buses Live" value={loading ? '…' : markers.length} icon={Navigation} />
          <KpiBentoCard
            label="On Route"
            value={loading ? '…' : markers.filter((m) => m.status === 'ON_ROUTE').length}
            icon={Radio}
          />
          <KpiBentoCard label="Geofence Alerts" value={alerts.length} icon={Bell} />
          <KpiBentoCard
            label="Delayed"
            value={loading ? '…' : markers.filter((m) => m.status === 'DELAYED').length}
            icon={AlertTriangle}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bento-card relative overflow-hidden p-0 lg:col-span-2">
            <div className="absolute left-4 top-4 z-10 rounded-lg bg-white/90 px-3 py-2 text-label-md font-medium text-on-surface shadow-sm">
              {liveFeed ? 'Live Map' : 'Route Map (awaiting GPS ingest)'}
            </div>
            <div
              className="relative h-[420px] bg-gradient-to-br from-[#dce9ff] via-[#eff4ff] to-[#cbdbf5]"
              aria-label="GPS live map"
            >
              <div className="absolute inset-0 opacity-30">
                <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="#0052d2"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              <div className="absolute left-[18%] top-[28%] h-32 w-32 rounded-full border-2 border-dashed border-secondary/40 bg-secondary/5" />
              <p className="absolute left-[20%] top-[24%] text-label-md font-medium text-secondary">
                School Geofence
              </p>

              {markers.map((marker, index) => {
                const top = 18 + index * 16;
                const left = 28 + index * 14;
                const active = marker.id === selected?.id;
                return (
                  <button
                    key={marker.id}
                    type="button"
                    onClick={() => setSelectedId(marker.id)}
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-transform ${
                      active ? 'scale-110' : 'hover:scale-105'
                    }`}
                    style={{ top: `${top}%`, left: `${left}%` }}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md ${
                        active ? 'bg-secondary text-white' : 'bg-white text-secondary'
                      }`}
                    >
                      <Navigation className="h-5 w-5" />
                    </span>
                    <span className="mt-1 rounded bg-white/90 px-2 py-0.5 text-label-md font-medium text-on-surface shadow-sm">
                      {marker.busNo}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {selected && (
              <div className="bento-card space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-title-lg font-semibold text-on-surface">{selected.busNo}</h3>
                    <p className="text-body-md text-on-surface-variant">
                      {selected.routeName} · {selected.driverName}
                    </p>
                  </div>
                  <Badge variant={selected.status === 'DELAYED' ? 'warning' : 'info'}>
                    {selected.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-body-md">
                  <div className="rounded-lg bg-surface-faint p-3">
                    <p className="text-label-md text-on-surface-variant">ETA</p>
                    <p className="font-semibold text-on-surface">{selected.etaMinutes} min</p>
                  </div>
                  <div className="rounded-lg bg-surface-faint p-3">
                    <p className="text-label-md text-on-surface-variant">Speed</p>
                    <p className="font-semibold text-on-surface">{selected.speedKmh} km/h</p>
                  </div>
                  <div className="rounded-lg bg-surface-faint p-3">
                    <p className="text-label-md text-on-surface-variant">Current Stop</p>
                    <p className="font-semibold text-on-surface">{selected.currentStop}</p>
                  </div>
                  <div className="rounded-lg bg-surface-faint p-3">
                    <p className="text-label-md text-on-surface-variant">Next Stop</p>
                    <p className="font-semibold text-on-surface">{selected.nextStop}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-surface-faint px-3 py-2">
                  <span className="inline-flex items-center gap-2 text-body-md text-on-surface-variant">
                    <Battery className="h-4 w-4" />
                    GPS device battery
                  </span>
                  <span className="font-semibold text-on-surface">{selected.batteryPct}%</span>
                </div>

                <p className="text-label-md text-on-surface-variant">
                  Last sync {formatRelativeTime(selected.lastSync)}
                </p>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handlePanic(selected.id)}
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  {panicSent === selected.id ? 'Panic Alert Sent!' : 'Simulate Panic Button'}
                </Button>
              </div>
            )}

            <div className="bento-card">
              <h3 className="mb-3 text-title-md font-semibold text-on-surface">Geofence Alerts</h3>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-lg bg-surface-faint px-3 py-2"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    <div>
                      <p className="text-body-md font-medium text-on-surface">
                        {alert.busNo} — {alert.type === 'ENTRY' ? 'Entered' : 'Exited'} {alert.zone}
                      </p>
                      <p className="text-label-md text-on-surface-variant">
                        {formatRelativeTime(alert.timestamp)}
                      </p>
                    </div>
                    <Badge variant={alert.type === 'ENTRY' ? 'success' : 'warning'}>
                      {alert.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {markers.map((marker) => (
            <button
              key={marker.id}
              type="button"
              onClick={() => setSelectedId(marker.id)}
              className={`bento-card text-left transition-shadow hover:shadow-card ${
                marker.id === selected?.id ? 'ring-2 ring-secondary' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-on-surface">{marker.busNo}</p>
                  <p className="text-body-md text-on-surface-variant">{marker.routeCode}</p>
                </div>
                <Badge variant={marker.status === 'DELAYED' ? 'warning' : 'info'}>
                  ETA {marker.etaMinutes}m
                </Badge>
              </div>
              <p className="mt-2 text-body-md text-on-surface-variant">
                {marker.studentsOnBoard} students · {marker.currentStop}
              </p>
            </button>
          ))}
        </div>
      </div>
    </SchoolShell>
  );
}
