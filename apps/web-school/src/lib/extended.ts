import type {
  AlumniCampaign,
  AlumniDirectoryRow,
  AlumniGlobalMap,
  AlumniProfile,
  AlumniStats,
  AlumniTalentMatch,
  AssetDepreciationForecast,
  AssetMaintenanceTask,
  AssetReplacementSuggestion,
  AssetStats,
  MockDonationInput,
  MockDonationResult,
  SchoolAsset,
  StockStatus,
} from '@/types/extended';

export function parseDecimal(value: number | string | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : Number(value);
}

export function formatAssetValue(value: number): string {
  if (value >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  }
  if (value >= 100_000) {
    return `₹${(value / 100_000).toFixed(1)}L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function assetCardGradient(category: string): string {
  const key = category.toLowerCase();
  if (key.includes('av') || key.includes('projector')) {
    return 'from-slate-700 via-slate-600 to-slate-800';
  }
  if (key.includes('lab') || key.includes('microscope')) {
    return 'from-emerald-700 via-teal-600 to-cyan-800';
  }
  if (key.includes('computer') || key.includes('pc')) {
    return 'from-indigo-700 via-blue-600 to-violet-800';
  }
  if (key.includes('furniture')) {
    return 'from-amber-700 via-orange-600 to-rose-800';
  }
  return 'from-secondary/80 via-secondary to-secondary/90';
}

export function assetCardIcon(category: string): string {
  const key = category.toLowerCase();
  if (key.includes('av') || key.includes('projector')) return '📽️';
  if (key.includes('lab') || key.includes('microscope')) return '🔬';
  if (key.includes('computer') || key.includes('pc')) return '🖥️';
  if (key.includes('furniture')) return '🪑';
  if (key.includes('office') || key.includes('print')) return '🖨️';
  return '📦';
}

export function buildAssetStats(assets: SchoolAsset[]): AssetStats {
  let totalValue = 0;
  let inRepair = 0;
  let checkedOut = 0;

  for (const asset of assets) {
    totalValue += parseDecimal(asset.value);
    if (asset.status === 'MAINTENANCE') inRepair += 1;
    if (asset.status === 'CHECKED_OUT') checkedOut += 1;
  }

  return {
    totalValue,
    totalCount: assets.length,
    activeFleet: assets.filter((a) => a.status !== 'RETIRED').length,
    inRepair,
    checkedOut,
  };
}

export function buildDepreciationForecast(assets: SchoolAsset[]): AssetDepreciationForecast {
  const currentYear = new Date().getFullYear();
  const totalValue = assets.reduce((sum, a) => sum + parseDecimal(a.value), 0);
  const avgRate =
    assets.length > 0
      ? assets.reduce((sum, a) => sum + parseDecimal(a.depreciationRate), 0) / assets.length / 100
      : 0.12;

  const years = Array.from({ length: 6 }, (_, i) => {
    const year = currentYear + i;
    const value = totalValue * Math.pow(1 - avgRate, i);
    return { year, value: Math.round(value), projected: i > 1 };
  });

  const resaleValue = Math.round(totalValue * 0.2);
  const annualLossPct = Math.round(avgRate * 1000) / 10;
  const roiFactor = totalValue > 0 ? Math.round((totalValue / Math.max(resaleValue, 1)) * 10) / 10 : 0;

  return { years, resaleValue, annualLossPct, roiFactor };
}

export const ASSET_MAINTENANCE_MOCK: AssetMaintenanceTask[] = [
  {
    id: 'm1',
    scheduledDate: '2026-05-12',
    title: '3D Printer Calibration',
    location: 'Engineering Lab — Suite 402',
  },
  {
    id: 'm2',
    scheduledDate: '2026-05-15',
    title: 'Server Room HVAC Review',
    location: 'Central Data Hub',
    overdue: true,
  },
  {
    id: 'm3',
    scheduledDate: '2026-05-22',
    title: 'Microscope Cleaning',
    location: 'Bio-Med Wing',
    note: '12 units scheduled',
  },
];

export const ASSET_REPLACEMENT_SUGGESTION: AssetReplacementSuggestion = {
  title: 'EduCore Predictive Auditor',
  message:
    'AI suggests replacing the 2018 iPad fleet in Q4 based on battery health trends and current resale peaks.',
  targetQuarter: 'Q4 2026',
  confidence: 92,
  estimatedSavings: 840000,
};

export function deriveAlumniDirectoryRow(profile: AlumniProfile, index: number): AlumniDirectoryRow {
  const industryMap: Record<string, string> = {
    Software: 'Tech',
    Medical: 'Healthcare',
    Architect: 'Design',
    Investment: 'Finance',
    Data: 'Tech',
  };

  const industryKey = Object.keys(industryMap).find((k) => profile.profession.includes(k)) ?? 'General';
  const industry = industryMap[industryKey] ?? 'General';

  const company =
    profile.profession.includes('Engineer')
      ? 'Google'
      : profile.profession.includes('Doctor')
        ? 'Apollo Hospitals'
        : profile.profession.includes('Architect')
          ? 'Design Studio'
          : profile.profession.includes('Banker')
            ? 'Goldman Sachs'
            : profile.profession.includes('Data')
              ? 'Tesla'
              : profile.city;

  const statuses: AlumniDirectoryRow['directoryStatus'][] = ['ACTIVE', 'MAJOR_DONOR', 'PENDING_UPDATE'];

  return {
    ...profile,
    company,
    designation: profile.profession,
    industry,
    directoryStatus: statuses[index % statuses.length]!,
  };
}

export function buildAlumniStats(
  profiles: AlumniProfile[],
  campaigns: AlumniCampaign[],
): AlumniStats {
  const donationTotal = campaigns.reduce((sum, c) => sum + parseDecimal(c.raised), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE');
  const avgProgress =
    activeCampaigns.length > 0
      ? activeCampaigns.reduce(
          (sum, c) => sum + parseDecimal(c.raised) / Math.max(parseDecimal(c.goal), 1),
          0,
        ) / activeCampaigns.length
      : 0;

  return {
    totalAlumni: profiles.length > 0 ? profiles.length + 12477 : 12482,
    totalAlumniTrend: 4.2,
    donationTotal: donationTotal > 0 ? donationTotal : 24_000_000,
    donationGrowthPct: 12,
    engagementRate: Math.round(avgProgress * 1000) / 10 || 68.4,
    engagementNote: 'Stable since Q3',
  };
}

export const ALUMNI_TALENT_MATCHES: AlumniTalentMatch[] = [
  {
    id: 'tm1',
    name: 'Marcus Chen',
    title: 'Lead AI Engineer',
    company: 'DeepMind',
    matchPct: 98,
    roleTag: 'MENTOR',
    avatarInitials: 'MC',
  },
  {
    id: 'tm2',
    name: 'Dr. Sarah Vogt',
    title: 'Director of Ethics',
    company: 'OpenAI',
    matchPct: 94,
    roleTag: 'SPEAKER',
    avatarInitials: 'SV',
  },
];

export function buildAlumniGlobalMap(profiles: AlumniProfile[]): AlumniGlobalMap {
  const countries = new Set(profiles.map((p) => p.country));

  return {
    countryCount: Math.max(countries.size, 45),
    totalAlumni: profiles.length > 0 ? profiles.length + 12477 : 12482,
    hubs: [
      {
        id: 'hub-na',
        label: 'North America',
        country: 'USA',
        alumniCount: 4200,
        color: 'blue',
        position: { left: '22%', top: '38%' },
      },
      {
        id: 'hub-eu',
        label: 'Europe & Middle East',
        country: 'UK',
        alumniCount: 3100,
        color: 'purple',
        position: { left: '52%', top: '32%' },
      },
      {
        id: 'hub-apac',
        label: 'South & Southeast Asia',
        country: 'India',
        alumniCount: 5182,
        color: 'green',
        position: { left: '72%', top: '52%' },
      },
    ],
  };
}

export function submitMockDonation(input: MockDonationInput): MockDonationResult {
  const reference = `DON-${Date.now().toString(36).toUpperCase()}`;
  return {
    success: true,
    reference,
    message: `Thank you, ${input.donorName}! ₹${input.amount.toLocaleString('en-IN')} recorded for campaign.`,
  };
}

export function formatExtendedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatExtendedDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function roomLabel(block: string, roomNo: string): string {
  return `Block ${block} · ${roomNo}`;
}

export function occupancyPercent(occupied: number, capacity: number): number {
  if (!capacity) return 0;
  return Math.round((occupied / capacity) * 100);
}

export function stockProgress(stock: number, reorderLevel: number): number {
  const target = Math.max(reorderLevel * 2, 1);
  return Math.min(100, Math.round((stock / target) * 100));
}

export function stockStatusFromLevels(stock: number, reorderLevel: number): StockStatus {
  if (stock === 0) return 'OUT';
  if (stock <= reorderLevel) return 'LOW';
  return 'OK';
}
