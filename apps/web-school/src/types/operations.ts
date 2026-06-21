export type LibraryTab = 'catalog' | 'issued' | 'overdue' | 'reservations' | 'new-arrivals';

export type BookstoreTab = 'inventory' | 'issue' | 'return' | 'damage';

export interface LibraryStats {
  totalBooks: number;
  issued: number;
  overdue: number;
  totalFines: number;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  copies: number;
  available: number;
  shelf: string;
  addedAt?: string;
}

export interface LibraryIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string;
  fineAmount: number;
  daysOverdue?: number;
}

export interface LibraryReservation {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  reservedAt: string;
  status: 'WAITING' | 'READY' | 'FULFILLED' | 'CANCELLED';
}

export interface TopBorrowedBook {
  title: string;
  borrowCount: number;
}

export interface LibraryReorderSuggestion {
  message: string;
  books: { title: string; currentStock: number; suggestedOrder: number }[];
  confidence: number;
}

export interface IssueBookInput {
  bookId: string;
  studentId: string;
  dueDate?: string;
}

export interface ReturnBookInput {
  issueId: string;
}

export interface BookstoreStats {
  totalTitles: number;
  inStock: number;
  issued: number;
  damageFinesCollected: number;
}

export interface Textbook {
  id: string;
  subject: string;
  className: string;
  title: string;
  publisher: string;
  price: number;
  stock: number;
  issued: number;
  rackNo?: string | null;
  isbn?: string | null;
}

export interface TextbookIssue {
  id: string;
  textbookId: string;
  textbookTitle: string;
  subject: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  issuedAt: string;
  returnedAt?: string;
  condition?: 'GOOD' | 'DAMAGED' | 'LOST';
  isbn?: string | null;
}

export interface TextbookDamageReport {
  id: string;
  textbookTitle: string;
  studentName: string;
  studentClass: string;
  damageType: string;
  fineAmount: number;
  reportedAt: string;
  status: 'PENDING' | 'PAID' | 'WAIVED';
}

export interface BookstoreStockChart {
  issued: number;
  available: number;
}

export interface BookstoreForecast {
  message: string;
  recommendations: {
    subject: string;
    className: string;
    title: string;
    currentStock: number;
    forecastDemand: number;
  }[];
  confidence: number;
}

export interface IssueTextbookInput {
  textbookId: string;
  studentId: string;
}

export interface ReturnTextbookInput {
  issueId: string;
  condition?: 'GOOD' | 'DAMAGED' | 'LOST';
}

export interface RecordDamageFineInput {
  issueId: string;
  damageType: string;
  fineAmount: number;
}

export const LIBRARY_FINE_PER_DAY = 2;

export const LIBRARY_TAB_ITEMS: { id: LibraryTab; label: string }[] = [
  { id: 'catalog', label: 'Catalog' },
  { id: 'issued', label: 'Issued' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'new-arrivals', label: 'New Arrivals' },
];

export const BOOKSTORE_TAB_ITEMS: { id: BookstoreTab; label: string }[] = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'issue', label: 'Issue' },
  { id: 'return', label: 'Return' },
  { id: 'damage', label: 'Damage Report' },
];

// ─── Transport ───────────────────────────────────────────────────────────────

export type TransportTab = 'fleet' | 'routes' | 'allocations' | 'drivers' | 'fuel';

export interface RouteStop {
  name: string;
  lat?: number;
  lng?: number;
}

export interface TransportVehicle {
  id: string;
  routeId: string;
  registrationNo: string;
  capacity: number;
  gpsDeviceId?: string | null;
  route?: { id: string; name: string; code: string };
}

export interface TransportRoute {
  id: string;
  name: string;
  code: string;
  stops: RouteStop[];
  distanceKm: number | string;
  driverName: string;
  driverPhone: string;
  vehicles: TransportVehicle[];
  _count?: { allocations: number };
}

export interface StudentTransportAllocation {
  id: string;
  studentId: string;
  routeId: string;
  stopName: string;
  pickupTime: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
  };
  route: { id: string; name: string; code: string };
}

export interface FuelCostPoint {
  month: string;
  cost: number;
  liters: number;
}

export const TRANSPORT_TAB_ITEMS: { id: TransportTab; label: string }[] = [
  { id: 'fleet', label: 'Fleet' },
  { id: 'routes', label: 'Routes' },
  { id: 'allocations', label: 'Student Allocation' },
  { id: 'drivers', label: 'Drivers' },
  { id: 'fuel', label: 'Fuel & Maintenance' },
];

export const MOCK_FUEL_COSTS: FuelCostPoint[] = [
  { month: 'Jan', cost: 82000, liters: 4100 },
  { month: 'Feb', cost: 78500, liters: 3920 },
  { month: 'Mar', cost: 91000, liters: 4550 },
  { month: 'Apr', cost: 87200, liters: 4360 },
  { month: 'May', cost: 94800, liters: 4740 },
  { month: 'Jun', cost: 89500, liters: 4475 },
];

// ─── GPS ─────────────────────────────────────────────────────────────────────

export type GpsBusStatus = 'ON_ROUTE' | 'AT_STOP' | 'DELAYED' | 'IDLE';

export interface GpsBusMarker {
  id: string;
  busNo: string;
  routeName: string;
  routeCode: string;
  driverName: string;
  status: GpsBusStatus;
  lat: number;
  lng: number;
  etaMinutes: number;
  currentStop: string;
  nextStop: string;
  speedKmh: number;
  studentsOnBoard: number;
  batteryPct: number;
  lastSync: string;
}

export interface GeofenceAlert {
  id: string;
  busNo: string;
  type: 'ENTRY' | 'EXIT';
  zone: string;
  timestamp: string;
}

export interface GpsLivePosition {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  updatedAt: string;
}

// ─── Health ──────────────────────────────────────────────────────────────────

export type HealthTab = 'profiles' | 'infirmary' | 'vaccinations' | 'reports';

export interface HealthStudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

export interface HealthRecord {
  id: string;
  studentId: string;
  bloodGroup?: string | null;
  allergies: string[];
  vaccinations: Array<Record<string, unknown>>;
  bmi?: number | string | null;
  lastCheckup?: string | null;
  student: HealthStudentSummary;
}

export interface InfirmaryVisit {
  id: string;
  studentId: string;
  visitDate: string;
  complaint: string;
  treatment: string;
  referred: boolean;
  student: HealthStudentSummary;
}

export interface CreateInfirmaryVisitInput {
  studentId: string;
  visitDate: string;
  complaint: string;
  treatment: string;
  referred?: boolean;
}

export const HEALTH_TAB_ITEMS: { id: HealthTab; label: string }[] = [
  { id: 'profiles', label: 'Student Health' },
  { id: 'infirmary', label: 'Infirmary Log' },
  { id: 'vaccinations', label: 'Vaccinations' },
  { id: 'reports', label: 'Health Reports' },
];

export const COMMON_AILMENTS = [
  { ailment: 'Headache', count: 24 },
  { ailment: 'Fever', count: 18 },
  { ailment: 'Stomach ache', count: 15 },
  { ailment: 'Sports injury', count: 12 },
  { ailment: 'Allergic reaction', count: 8 },
];

// ─── Clubs ───────────────────────────────────────────────────────────────────

export interface ClubAdvisor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ClubSummary {
  id: string;
  name: string;
  category: string;
  maxMembers: number;
  memberCount: number;
  advisor?: ClubAdvisor | null;
  _count?: { memberships: number };
}

export interface ClubMember {
  id: string;
  clubId: string;
  studentId: string;
  joinedAt: string;
  status: 'ACTIVE' | 'INACTIVE';
  student: HealthStudentSummary;
}

export interface ClubActivityEntry {
  id: string;
  clubName: string;
  action: string;
  detail: string;
  timestamp: string;
}

export const CLUB_CATEGORY_COLORS: Record<string, string> = {
  Academic: 'bg-secondary/10 text-secondary',
  Sports: 'bg-success/10 text-success',
  Arts: 'bg-ai-violet/10 text-ai-violet',
  Technology: 'bg-primary/10 text-primary',
  Service: 'bg-warning/10 text-warning',
};

// ─── Uniform ─────────────────────────────────────────────────────────────────

export type UniformTab = 'inventory' | 'orders' | 'distribution' | 'supplier';

export type UniformOrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

export interface UniformItem {
  id: string;
  name: string;
  size: string;
  sku: string;
  stock: number;
  price: number | string;
}

export interface UniformOrderLine {
  itemId: string;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface UniformOrder {
  id: string;
  studentId: string;
  items: UniformOrderLine[];
  status: UniformOrderStatus;
  totalAmount: number | string;
  createdAt: string;
  student: HealthStudentSummary;
}

export const UNIFORM_TAB_ITEMS: { id: UniformTab; label: string }[] = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'orders', label: 'Orders' },
  { id: 'distribution', label: 'Distribution' },
  { id: 'supplier', label: 'Supplier' },
];

export const UNIFORM_REORDER_LEVEL = 20;
