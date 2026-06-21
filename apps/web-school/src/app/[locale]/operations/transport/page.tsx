'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  DataTable,
  KpiBentoCard,
  TabGroup,
} from '@eduai365/ui';
import {
  Bus,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Route,
  Users,
  Wrench,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInr } from '@/lib/format';
import {
  fleetStatusLabel,
  getMockFuelCosts,
  parseDecimal,
  routeStopCount,
  studentDisplayName,
} from '@/lib/operations';
import type {
  StudentTransportAllocation,
  TransportRoute,
  TransportTab,
  TransportVehicle,
} from '@/types/operations';
import { TRANSPORT_TAB_ITEMS } from '@/types/operations';

export default function TransportPage() {
  const [activeTab, setActiveTab] = useState<TransportTab>('fleet');
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [allocations, setAllocations] = useState<StudentTransportAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [routeList, vehicleList, allocationList] = await Promise.all([
        apiFetch<TransportRoute[]>('/operations/transport/routes'),
        apiFetch<TransportVehicle[]>('/operations/transport/vehicles'),
        apiFetch<StudentTransportAllocation[]>('/operations/transport/allocations'),
      ]);
      setRoutes(routeList);
      setVehicles(vehicleList);
      setAllocations(allocationList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transport data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const fuelData = getMockFuelCosts();
  const totalCapacity = useMemo(
    () => vehicles.reduce((sum, v) => sum + v.capacity, 0),
    [vehicles],
  );
  const drivers = useMemo(
    () =>
      routes.map((route) => ({
        id: route.id,
        name: route.driverName,
        phone: route.driverPhone,
        route: `${route.name} (${route.code})`,
        bus: route.vehicles[0]?.registrationNo ?? '—',
      })),
    [routes],
  );

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Transport Management</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Fleet routes, drivers, student allocation, and fuel tracking
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/operations/gps">
              <Button variant="secondary">
                <Navigation className="mr-2 h-4 w-4" />
                GPS Tracking
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiBentoCard label="Routes" value={loading ? '…' : routes.length} icon={Route} />
          <KpiBentoCard label="Fleet Buses" value={loading ? '…' : vehicles.length} icon={Bus} />
          <KpiBentoCard
            label="Students Allocated"
            value={loading ? '…' : allocations.length}
            icon={Users}
          />
          <KpiBentoCard label="Total Capacity" value={loading ? '…' : totalCapacity} icon={Bus} />
        </div>

        <TabGroup
          tabs={TRANSPORT_TAB_ITEMS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TransportTab)}
        />

        {error && (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
        )}

        {activeTab === 'fleet' && (
          <DataTable
            columns={[
              { key: 'registrationNo', header: 'Bus No.' },
              {
                key: 'route',
                header: 'Route',
                render: (row) =>
                  row.route ? `${row.route.name} (${row.route.code})` : '—',
              },
              { key: 'capacity', header: 'Capacity' },
              {
                key: 'gps',
                header: 'GPS',
                render: (row) => (
                  <Badge variant={row.gpsDeviceId ? 'success' : 'outline'}>
                    {fleetStatusLabel(row)}
                  </Badge>
                ),
              },
            ]}
            data={vehicles}
            keyExtractor={(row) => row.id}
            emptyMessage={loading ? 'Loading fleet…' : 'No vehicles registered'}
          />
        )}

        {activeTab === 'routes' && (
          <div className="space-y-4">
            {routes.map((route) => (
              <div key={route.id} className="bento-card space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-title-lg font-semibold text-on-surface">{route.name}</h3>
                    <p className="text-body-md text-on-surface-variant">
                      {route.code} · {parseDecimal(route.distanceKm)} km ·{' '}
                      {routeStopCount(route.stops)} stops · {route._count?.allocations ?? 0}{' '}
                      students
                    </p>
                  </div>
                  <Badge variant="outline">{route.driverName}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {route.stops.map((stop) => (
                    <span
                      key={stop.name}
                      className="inline-flex items-center gap-1 rounded-full bg-surface-faint px-3 py-1 text-body-md text-on-surface-variant"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {stop.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {!loading && routes.length === 0 && (
              <div className="bento-card py-12 text-center text-on-surface-variant">
                No routes configured
              </div>
            )}
          </div>
        )}

        {activeTab === 'allocations' && (
          <DataTable
            columns={[
              {
                key: 'student',
                header: 'Student',
                render: (row) => studentDisplayName(row.student),
              },
              { key: 'admissionNo', header: 'Admission No.', render: (row) => row.student.admissionNo },
              {
                key: 'route',
                header: 'Route',
                render: (row) => `${row.route.name} (${row.route.code})`,
              },
              { key: 'stopName', header: 'Stop' },
              { key: 'pickupTime', header: 'Pickup' },
            ]}
            data={allocations}
            keyExtractor={(row) => row.id}
            emptyMessage={loading ? 'Loading allocations…' : 'No student allocations'}
          />
        )}

        {activeTab === 'drivers' && (
          <DataTable
            columns={[
              { key: 'name', header: 'Driver' },
              {
                key: 'phone',
                header: 'Contact',
                render: (row) => (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-on-surface-variant" />
                    {row.phone}
                  </span>
                ),
              },
              { key: 'route', header: 'Assigned Route' },
              { key: 'bus', header: 'Bus' },
            ]}
            data={drivers}
            keyExtractor={(row) => row.id}
            emptyMessage={loading ? 'Loading drivers…' : 'No drivers assigned'}
          />
        )}

        {activeTab === 'fuel' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="bento-card lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-secondary" />
                <h3 className="text-title-lg font-semibold text-on-surface">
                  Monthly Fuel Cost (Mock)
                </h3>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dce9ff" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip formatter={(value: number) => formatInr(value)} />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#0052d2"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-4">
              {fuelData.slice(-3).map((point) => (
                <div key={point.month} className="bento-card">
                  <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                    {point.month} 2025
                  </p>
                  <p className="mt-1 text-headline-md font-bold text-on-surface">
                    {formatInr(point.cost)}
                  </p>
                  <p className="text-body-md text-on-surface-variant">{point.liters} L consumed</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SchoolShell>
  );
}
