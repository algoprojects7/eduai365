import {
  CLUB_CATEGORY_COLORS,
  LIBRARY_FINE_PER_DAY,
  MOCK_FUEL_COSTS,
  UNIFORM_REORDER_LEVEL,
  type ClubSummary,
  type GpsBusMarker,
  type GpsBusStatus,
  type GpsLivePosition,
  type HealthStudentSummary,
  type RouteStop,
  type TransportRoute,
  type TransportVehicle,
  type UniformItem,
} from '@/types/operations';

export function calculateLibraryFine(daysOverdue: number, ratePerDay = LIBRARY_FINE_PER_DAY): number {
  return Math.max(0, daysOverdue) * ratePerDay;
}

export function formatAvailability(available: number, copies: number): string {
  return `${available} / ${copies}`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function defaultDueDate(daysFromNow = 14): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

export function reservationStatusLabel(
  status: 'WAITING' | 'READY' | 'FULFILLED' | 'CANCELLED',
): string {
  const labels = {
    WAITING: 'Waiting',
    READY: 'Ready for pickup',
    FULFILLED: 'Fulfilled',
    CANCELLED: 'Cancelled',
  };
  return labels[status];
}

export function damageStatusVariant(
  status: 'PENDING' | 'PAID' | 'WAIVED',
): 'pending' | 'active' | 'inactive' {
  if (status === 'PAID') return 'active';
  if (status === 'PENDING') return 'pending';
  return 'inactive';
}

export function studentDisplayName(student: HealthStudentSummary): string {
  return `${student.firstName} ${student.lastName}`.trim();
}

export function parseDecimal(value: number | string | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : Number(value);
}

export function uniformStockStatus(item: UniformItem): 'ok' | 'low' | 'out' {
  if (item.stock <= 0) return 'out';
  if (item.stock <= UNIFORM_REORDER_LEVEL) return 'low';
  return 'ok';
}

export function clubCategoryClass(category: string): string {
  return CLUB_CATEGORY_COLORS[category] ?? 'bg-surface-container text-on-surface-variant';
}

export function clubMembershipPct(club: ClubSummary): number {
  if (club.maxMembers <= 0) return 0;
  return Math.round((club.memberCount / club.maxMembers) * 100);
}

export function routeStopCount(stops: RouteStop[]): number {
  return stops.length;
}

export function fleetStatusLabel(vehicle: TransportVehicle): string {
  return vehicle.gpsDeviceId ? 'Active' : 'No GPS';
}

export function buildGpsMarkersFromRoutes(routes: TransportRoute[]): GpsBusMarker[] {
  const statuses: GpsBusStatus[] = ['ON_ROUTE', 'AT_STOP', 'DELAYED', 'ON_ROUTE'];
  return routes.flatMap((route, routeIndex) =>
    route.vehicles.map((vehicle, vehicleIndex) => {
      const stop = route.stops[vehicleIndex % Math.max(route.stops.length, 1)];
      const nextStop = route.stops[(vehicleIndex + 1) % Math.max(route.stops.length, 1)];
      return {
        id: vehicle.id,
        busNo: vehicle.registrationNo,
        routeName: route.name,
        routeCode: route.code,
        driverName: route.driverName,
        status: statuses[(routeIndex + vehicleIndex) % statuses.length]!,
        lat: stop?.lat ?? 6.5244 + routeIndex * 0.02,
        lng: stop?.lng ?? 3.3792 + vehicleIndex * 0.015,
        etaMinutes: 4 + vehicleIndex * 3,
        currentStop: stop?.name ?? 'En route',
        nextStop: nextStop?.name ?? 'School',
        speedKmh: 28 + vehicleIndex * 5,
        studentsOnBoard: route._count?.allocations ?? 0,
        batteryPct: 72 + vehicleIndex * 6,
        lastSync: new Date(Date.now() - vehicleIndex * 120_000).toISOString(),
      };
    }),
  );
}

export function mergeLiveGpsWithMarkers(
  positions: GpsLivePosition[],
  baseMarkers: GpsBusMarker[],
): GpsBusMarker[] {
  if (positions.length === 0) {
    return baseMarkers;
  }

  const byVehicleId = new Map(baseMarkers.map((marker) => [marker.id, marker]));

  return positions.map((position) => {
    const base = byVehicleId.get(position.vehicleId);
    const speedKmh = Math.round(position.speed);
    const status: GpsBusStatus =
      speedKmh <= 2 ? 'AT_STOP' : speedKmh >= 45 ? 'DELAYED' : 'ON_ROUTE';

    if (base) {
      return {
        ...base,
        lat: position.lat,
        lng: position.lng,
        speedKmh,
        status,
        lastSync: position.updatedAt,
      };
    }

    return {
      id: position.vehicleId,
      busNo: position.vehicleId.slice(0, 12).toUpperCase(),
      routeName: 'Unknown route',
      routeCode: '—',
      driverName: '—',
      status,
      lat: position.lat,
      lng: position.lng,
      etaMinutes: 0,
      currentStop: 'Live position',
      nextStop: '—',
      speedKmh,
      studentsOnBoard: 0,
      batteryPct: 0,
      lastSync: position.updatedAt,
    };
  });
}

export function getMockFuelCosts() {
  return MOCK_FUEL_COSTS;
}

export { formatRelativeTime } from '@/lib/format';
