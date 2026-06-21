// ─── Hostel ───────────────────────────────────────────────────────────────────

export type HostelTab = 'rooms' | 'mess' | 'visitors' | 'fees';

export const HOSTEL_TAB_ITEMS: { id: HostelTab; label: string }[] = [
  { id: 'rooms', label: 'Room Allocation' },
  { id: 'mess', label: 'Mess Menu' },
  { id: 'visitors', label: 'Visitor Log' },
  { id: 'fees', label: 'Hostel Fees' },
];

export type HostelRoomType = 'AC' | 'NON_AC';

export const HOSTEL_ROOM_TYPE_LABELS: Record<HostelRoomType, string> = {
  AC: 'AC',
  NON_AC: 'Non-AC',
};

export interface HostelResident {
  id: string;
  name: string;
  admissionNo: string;
  className: string;
}

export interface HostelRoom {
  id: string;
  block: string;
  roomNo: string;
  floor: number;
  capacity: number;
  occupied: number;
  available: number;
  type: HostelRoomType;
  residents: HostelResident[];
}

export interface HostelStats {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  visitorsToday: number;
  pendingFees: number;
}

export interface MessMenuDay {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface VisitorLogEntry {
  id: string;
  visitorName: string;
  studentId: string;
  studentName: string;
  relation: string;
  purpose: string;
  idProof?: string;
  checkIn: string;
  checkOut?: string | null;
}

export interface CreateVisitorInput {
  visitorName: string;
  studentId: string;
  relation: string;
  purpose: string;
  idProof?: string;
}

export type HostelFeeStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';

export const HOSTEL_FEE_STATUS_LABELS: Record<HostelFeeStatus, string> = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  PENDING: 'Pending',
  OVERDUE: 'Overdue',
};

export interface HostelFee {
  id: string;
  studentId: string;
  studentName: string;
  term: string;
  amount: number;
  paid: number;
  dueDate: string;
  status: HostelFeeStatus;
}

export interface AllocateRoomInput {
  studentId: string;
}

// ─── General Inventory ────────────────────────────────────────────────────────

export type InventoryTab = 'stock' | 'alerts';

export const INVENTORY_TAB_ITEMS: { id: InventoryTab; label: string }[] = [
  { id: 'stock', label: 'Consumables Stock' },
  { id: 'alerts', label: 'Reorder Alerts' },
];

export type StockStatus = 'OK' | 'LOW' | 'OUT';

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  OK: 'In Stock',
  LOW: 'Low Stock',
  OUT: 'Out of Stock',
};

export interface ConsumableItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  reorderLevel: number;
  lastRestocked: string;
  supplier: string;
  stockStatus: StockStatus;
}

export interface InventoryStats {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  reorderAlerts: number;
  categories: number;
}

export type ReorderSeverity = 'WARNING' | 'CRITICAL';

export const REORDER_SEVERITY_LABELS: Record<ReorderSeverity, string> = {
  WARNING: 'Low Stock',
  CRITICAL: 'Out of Stock',
};

export interface ReorderAlert {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  supplier: string;
  severity: ReorderSeverity;
}

export interface UpdateConsumableStockInput {
  stock: number;
  reorderLevel?: number;
}

export function hostelFeeStatusVariant(
  status: HostelFeeStatus,
): 'success' | 'warning' | 'error' | 'info' {
  if (status === 'PAID') return 'success';
  if (status === 'PARTIAL') return 'info';
  if (status === 'OVERDUE') return 'error';
  return 'warning';
}

export function stockStatusVariant(status: StockStatus): 'success' | 'warning' | 'error' {
  if (status === 'OK') return 'success';
  if (status === 'LOW') return 'warning';
  return 'error';
}

export function reorderSeverityVariant(severity: ReorderSeverity): 'warning' | 'error' {
  return severity === 'CRITICAL' ? 'error' : 'warning';
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export type AssetStatus = 'AVAILABLE' | 'CHECKED_OUT' | 'MAINTENANCE' | 'RETIRED';

export type AssetCategoryTab = 'all' | 'lab-tech' | 'av-gear';

export const ASSET_CATEGORY_TABS: { id: AssetCategoryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'lab-tech', label: 'Lab Tech' },
  { id: 'av-gear', label: 'AV Gear' },
];

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  AVAILABLE: 'Operational',
  CHECKED_OUT: 'Deployed',
  MAINTENANCE: 'Calibrating',
  RETIRED: 'Retired',
};

export interface AssetEmployeeRef {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AssetCheckout {
  id: string;
  assetId: string;
  employeeId: string;
  checkedOutAt: string;
  returnedAt?: string | null;
  employee?: AssetEmployeeRef;
  asset?: { id: string; name: string; serialNo: string | null };
}

export interface SchoolAsset {
  id: string;
  name: string;
  category: string;
  serialNo: string | null;
  qrCode: string | null;
  location: string | null;
  purchaseDate: string | null;
  value: number | string | null;
  depreciationRate: number | string | null;
  status: AssetStatus;
  checkouts?: AssetCheckout[];
}

export interface AssetStats {
  totalValue: number;
  totalCount: number;
  activeFleet: number;
  inRepair: number;
  checkedOut: number;
}

export interface DepreciationYear {
  year: number;
  value: number;
  projected: boolean;
}

export interface AssetDepreciationForecast {
  years: DepreciationYear[];
  resaleValue: number;
  annualLossPct: number;
  roiFactor: number;
}

export interface AssetMaintenanceTask {
  id: string;
  scheduledDate: string;
  title: string;
  location: string;
  note?: string;
  overdue?: boolean;
}

export interface AssetReplacementSuggestion {
  title: string;
  message: string;
  targetQuarter: string;
  confidence: number;
  estimatedSavings: number;
}

export function assetStatusVariant(
  status: AssetStatus,
): 'success' | 'warning' | 'info' | 'error' | 'default' {
  if (status === 'AVAILABLE') return 'success';
  if (status === 'CHECKED_OUT') return 'info';
  if (status === 'MAINTENANCE') return 'warning';
  return 'default';
}

export function assetCategoryTabMatches(category: string, tab: AssetCategoryTab): boolean {
  if (tab === 'all') return true;
  const normalized = category.toLowerCase();
  if (tab === 'lab-tech') {
    return (
      normalized.includes('lab') ||
      normalized.includes('computer') ||
      normalized.includes('microscope')
    );
  }
  return normalized.includes('av') || normalized.includes('projector');
}

// ─── Alumni ───────────────────────────────────────────────────────────────────

export type AlumniCampaignStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type AlumniDirectoryStatus = 'ACTIVE' | 'MAJOR_DONOR' | 'PENDING_UPDATE';

export const ALUMNI_DIRECTORY_STATUS_LABELS: Record<AlumniDirectoryStatus, string> = {
  ACTIVE: 'Active',
  MAJOR_DONOR: 'Major Donor',
  PENDING_UPDATE: 'Pending Update',
};

export interface AlumniProfile {
  id: string;
  name: string;
  batchYear: number;
  profession: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedin: string | null;
}

export interface AlumniDirectoryRow extends AlumniProfile {
  company: string;
  designation: string;
  industry: string;
  directoryStatus: AlumniDirectoryStatus;
}

export interface AlumniCampaign {
  id: string;
  title: string;
  goal: number | string;
  raised: number | string;
  status: AlumniCampaignStatus;
}

export interface AlumniStats {
  totalAlumni: number;
  totalAlumniTrend: number;
  donationTotal: number;
  donationGrowthPct: number;
  engagementRate: number;
  engagementNote: string;
}

export interface AlumniTalentMatch {
  id: string;
  name: string;
  title: string;
  company: string;
  matchPct: number;
  roleTag: 'MENTOR' | 'SPEAKER';
  avatarInitials: string;
}

export interface AlumniMapHub {
  id: string;
  label: string;
  country: string;
  alumniCount: number;
  color: 'blue' | 'purple' | 'green';
  position: { left: string; top: string };
}

export interface AlumniGlobalMap {
  countryCount: number;
  totalAlumni: number;
  hubs: AlumniMapHub[];
}

export interface MockDonationInput {
  campaignId: string;
  donorName: string;
  amount: number;
}

export interface MockDonationResult {
  success: boolean;
  reference: string;
  message: string;
}

export function alumniDirectoryStatusVariant(
  status: AlumniDirectoryStatus,
): 'success' | 'info' | 'warning' {
  if (status === 'MAJOR_DONOR') return 'info';
  if (status === 'PENDING_UPDATE') return 'warning';
  return 'success';
}

export function campaignProgressPct(raised: number, goal: number): number {
  if (!goal) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}
