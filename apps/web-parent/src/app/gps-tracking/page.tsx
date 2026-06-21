'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, TabGroup } from '@eduai365/ui';
import {
  Battery,
  MapPin,
  RefreshCw,
  Shield,
  PhoneCall,
  User,
} from 'lucide-react';
import { ParentShell } from '@/components/parent-shell';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import type { ParentChild, ParentDashboard } from '@/types/parent';

interface ChildGpsData {
  enabled: boolean;
  lastLocation: string;
  batteryPercent: number;
  lastSync: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  routeNumber: string;
  currentSpeed: string;
  coordinates: { lat: number; lng: number };
  helperName?: string;
  helperPhone?: string;
}

// Custom mock GPS data per child
const MOCK_CHILD_GPS: Record<string, ChildGpsData> = {
  default: {
    enabled: true,
    lastLocation: 'En route — Route 7 (Greenfield Bus)',
    batteryPercent: 78,
    lastSync: new Date().toISOString(),
    driverName: 'Mr. Ramesh Kumar',
    driverPhone: '+91 98765 43210',
    vehicleNumber: 'KA-01-F-1234',
    routeNumber: 'Route 7 (Greenfield Express)',
    currentSpeed: '42 km/h',
    coordinates: { lat: 12.9716, lng: 77.5946 },
    helperName: 'Mr. Suresh Singh',
    helperPhone: '+91 98765 12345',
  },
  chioma: {
    enabled: true,
    lastLocation: 'Near Central Library Intersection',
    batteryPercent: 88,
    lastSync: new Date().toISOString(),
    driverName: 'Mr. John Obi',
    driverPhone: '+91 99887 76655',
    vehicleNumber: 'KA-03-M-5678',
    routeNumber: 'Route 4B (Metro Shuttle)',
    currentSpeed: '30 km/h',
    coordinates: { lat: 12.9279, lng: 77.6271 },
    helperName: 'Mr. Chidi Benson',
    helperPhone: '+91 99887 11223',
  },
  tunde: {
    enabled: true,
    lastLocation: 'School Bus Drop-off Zone A',
    batteryPercent: 95,
    lastSync: new Date().toISOString(),
    driverName: 'Mr. Samuel Alao',
    driverPhone: '+91 91234 56789',
    vehicleNumber: 'KA-05-H-9012',
    routeNumber: 'Route 12 (North Campus)',
    currentSpeed: '0 km/h (Stopped)',
    coordinates: { lat: 12.9724, lng: 77.6104 },
    helperName: 'Mr. Wale Jimoh',
    helperPhone: '+91 91234 44556',
  },
};

export default function GpsTrackingPage() {
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [gpsData, setGpsData] = useState<ChildGpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch dashboard context to get children list
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const dash = await apiFetch<ParentDashboard>('/parent/dashboard');
        if (!cancelled) {
          const rawDash = dash as {
            parentName?: string;
            children?: Array<{
              id?: string;
              name?: string;
              firstName?: string;
              lastName?: string;
              class?: string;
              className?: string;
              section?: string;
            }>;
          };
          const normalisedChildren = Array.isArray(rawDash.children)
            ? rawDash.children.map((child) => {
                const nameParts = (child.name ?? '').split(' ');
                const firstName = child.firstName ?? nameParts[0] ?? '';
                const lastName = child.lastName ?? nameParts.slice(1).join(' ') ?? '';
                return {
                  id: child.id ?? '',
                  firstName,
                  lastName,
                  className: child.className ?? child.class ?? 'Unassigned',
                  section: child.section ?? '',
                };
              })
            : [];

          const normalisedDashboard: ParentDashboard = {
            parentName: rawDash.parentName ?? 'Parent',
            children: normalisedChildren,
          };

          setDashboard(normalisedDashboard);
          if (normalisedChildren.length > 0) {
            setSelectedChildId(normalisedChildren[0]?.id ?? null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Load child GPS details when selectedChildId changes
  useEffect(() => {
    if (!selectedChildId) return;

    setChildLoading(true);
    // Determine which mock child gps coordinates to set
    const selectedChild = dashboard?.children.find((c) => c.id === selectedChildId);
    const key = selectedChild?.firstName.toLowerCase() || 'default';
    const mockGps = (MOCK_CHILD_GPS[key] || MOCK_CHILD_GPS.default) as ChildGpsData;

    // Simulate short network delay
    const timer = setTimeout(() => {
      setGpsData({
        ...mockGps,
        lastSync: new Date().toISOString(),
      });
      setChildLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedChildId, dashboard]);

  const selectedChild = dashboard?.children.find((c) => c.id === selectedChildId);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      if (gpsData) {
        // slightly tweak coordinates and speed to simulate movement
        setGpsData({
          ...gpsData,
          lastSync: new Date().toISOString(),
          currentSpeed: `${Math.floor(25 + Math.random() * 25)} km/h`,
          coordinates: {
            lat: gpsData.coordinates.lat + (Math.random() - 0.5) * 0.002,
            lng: gpsData.coordinates.lng + (Math.random() - 0.5) * 0.002,
          },
        });
      }
      setRefreshing(false);
    }, 800);
  };

  return (
    <ParentShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-secondary" strokeWidth={1.5} />
              <h1 className="text-headline-lg font-bold text-on-surface">GPS Live Tracking</h1>
            </div>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Monitor school bus live locations, driver telemetry, and arrival estimates.
            </p>
          </div>
          {gpsData && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleRefresh}
              disabled={refreshing || childLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
          )}
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading portal data…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {dashboard && !loading && (
          <>
            {/* Child Selector */}
            {dashboard.children.length > 0 && (
              <TabGroup
                tabs={dashboard.children.map((child: ParentChild) => ({
                  id: child.id,
                  label: `${child.firstName} (${child.className}${child.section})`,
                }))}
                activeTab={selectedChildId ?? dashboard.children[0]?.id ?? ''}
                onChange={setSelectedChildId}
              />
            )}

            {childLoading && (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                Loading GPS track details…
              </div>
            )}

            {!childLoading && !error && selectedChild && gpsData && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Google Map View (col-span-2) */}
                <section className="bento-card lg:col-span-2 relative min-h-[400px] overflow-hidden flex flex-col justify-end p-0 rounded-2xl border border-surface-container-high bg-slate-100">
                  <iframe
                    src={`https://maps.google.com/maps?q=${gpsData.coordinates.lat},${gpsData.coordinates.lng}&z=16&output=embed`}
                    className="absolute inset-0 w-full h-full border-0 z-0"
                    allowFullScreen
                    loading="lazy"
                  />

                  {/* Info Overlay Panel */}
                  <div className="relative z-10 m-4 p-4 rounded-xl border border-gray-200/50 bg-white/95 shadow-lg backdrop-blur flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-body-md font-semibold text-on-surface">{gpsData.lastLocation}</p>
                        <p className="text-body-sm text-on-surface-variant mt-0.5">
                          Coordinates: {gpsData.coordinates.lat.toFixed(4)}° N, {gpsData.coordinates.lng.toFixed(4)}° E
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-t pt-3 sm:border-t-0 sm:pt-0">
                      <div className="text-right">
                        <span className="text-label-md uppercase tracking-wider text-on-surface-variant block">Status</span>
                        <Badge variant="success">Active</Badge>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Telemetry and Driver Details Column (col-span-1) */}
                <section className="space-y-6">
                  {/* Status Bento Box */}
                  <div className="bento-card space-y-4">
                    <h2 className="text-title-lg font-bold text-on-surface">Vehicle Telemetry</h2>
                    <div className="divide-y divide-gray-100 text-body-md">
                      <div className="py-2.5 flex justify-between">
                        <span className="text-on-surface-variant">Current Speed</span>
                        <span className="font-semibold text-on-surface">{gpsData.currentSpeed}</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-on-surface-variant">Battery Status</span>
                        <span className="font-semibold text-on-surface flex items-center gap-1.5">
                          <Battery className="h-4.5 w-4.5 text-success" />
                          {gpsData.batteryPercent}% Charged
                        </span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-on-surface-variant">Last Synced</span>
                        <span className="text-on-surface-variant font-medium">
                          {formatRelativeTime(gpsData.lastSync)}
                        </span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-on-surface-variant">Active Route</span>
                        <span className="font-semibold text-secondary">{gpsData.routeNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Driver Contact Bento Box */}
                  <div className="bento-card space-y-4">
                    <h2 className="text-title-lg font-bold text-on-surface">Driver & Crew</h2>
                    <div className="flex items-center gap-3 bg-surface-faint/30 p-3.5 rounded-xl border border-gray-100">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">{gpsData.driverName}</p>
                        <p className="text-body-sm text-on-surface-variant">Assigned Driver</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between text-body-md">
                        <span className="text-on-surface-variant">Vehicle No</span>
                        <span className="font-semibold text-on-surface">{gpsData.vehicleNumber}</span>
                      </div>
                      <div className="flex justify-between text-body-md">
                        <span className="text-on-surface-variant">Driver Contact</span>
                        <span className="font-semibold text-on-surface">{gpsData.driverPhone}</span>
                      </div>
                      {gpsData.helperName && (
                        <div className="flex justify-between text-body-md border-t border-gray-100 pt-2">
                          <span className="text-on-surface-variant">Helper Name</span>
                          <span className="font-semibold text-on-surface">{gpsData.helperName}</span>
                        </div>
                      )}
                      {gpsData.helperPhone && (
                        <div className="flex justify-between text-body-md">
                          <span className="text-on-surface-variant">Helper Contact</span>
                          <span className="font-semibold text-on-surface">{gpsData.helperPhone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={() => alert(`Calling driver: ${gpsData.driverPhone}`)}
                      >
                        <PhoneCall className="h-4 w-4" />
                        Call Driver
                      </Button>
                      {gpsData.helperPhone && (
                        <Button
                          variant="secondary"
                          className="flex-1 flex items-center justify-center gap-2"
                          onClick={() => alert(`Calling helper: ${gpsData.helperPhone}`)}
                        >
                          <PhoneCall className="h-4 w-4" />
                          Call Helper
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Safety Guard Bento Box */}
                  <div className="bento-card border-success/30 bg-success/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-success" />
                      <h3 className="font-semibold text-success text-body-md">Safe Zone Shield Active</h3>
                    </div>
                    <p className="text-label-lg text-success/80">
                      This school bus route is monitored by eduAI365 security. Live geofence boundaries ensure instant notifications for any unexpected deviations.
                    </p>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </ParentShell>
  );
}
