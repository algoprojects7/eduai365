export type CommsTab = 'notices' | 'circulars' | 'logs' | 'complaints' | 'broadcast' | 'birthdays';

export const COMMS_TAB_ITEMS: { id: CommsTab; label: string }[] = [
  { id: 'notices', label: 'Notice Board' },
  { id: 'circulars', label: 'Circulars' },
  { id: 'logs', label: 'SMS/Email Log' },
  { id: 'complaints', label: 'Complaints/Grievance' },
  { id: 'broadcast', label: 'Broadcast' },
  { id: 'birthdays', label: 'Birthdays 🎂' },
];

export const NOTICE_CATEGORIES = ['ACADEMIC', 'SPORTS', 'HOLIDAY', 'EXAM', 'GENERAL'] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  ACADEMIC: 'Academic',
  SPORTS: 'Sports',
  HOLIDAY: 'Holiday',
  EXAM: 'Exam',
  GENERAL: 'General',
};

export const DELIVERY_CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP'] as const;
export type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number];

export const DELIVERY_CHANNEL_LABELS: Record<DeliveryChannel, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  PUSH: 'Push',
  IN_APP: 'In-App',
};

export const DELIVERY_STATUSES = [
  'PENDING',
  'QUEUED',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const COMPLAINT_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'RESOLVED'] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  RESOLVED: 'Resolved',
};

export interface CommsUserRef {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
  email?: string;
}

export interface AudienceFilter {
  classIds?: string[];
  sectionIds?: string[];
  roles?: string[];
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  category: NoticeCategory;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: string;
  expiresAt?: string | null;
  createdBy: CommsUserRef;
}

export interface CreateNoticeInput {
  title: string;
  body: string;
  category: NoticeCategory;
  isPinned?: boolean;
  isPublished?: boolean;
  expiresAt?: string;
}

export interface Circular {
  id: string;
  title: string;
  body: string;
  audienceFilter: AudienceFilter;
  publishedAt: string;
  createdBy: CommsUserRef;
}

export interface CreateCircularInput {
  title: string;
  body: string;
  audienceFilter?: AudienceFilter;
}

export interface ComplaintMessage {
  id: string;
  body: string;
  isStaffReply: boolean;
  createdAt: string;
  sender: CommsUserRef;
}

export interface ComplaintThread {
  id: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  submittedBy: CommsUserRef;
  assignedTo?: CommsUserRef | null;
  messages: ComplaintMessage[];
}

export interface CreateComplaintInput {
  subject: string;
  description: string;
}

export interface CreateComplaintMessageInput {
  body: string;
}

export interface CreateBroadcastInput {
  title: string;
  message: string;
  channels: DeliveryChannel[];
  audienceFilter: AudienceFilter;
  scheduledAt?: string;
}

export interface BroadcastCampaignSummary {
  id: string;
  title: string;
  status: string;
  totalRecipients: number;
  deliveredCount: number;
  failedCount: number;
  sentAt?: string | null;
  channels: DeliveryChannel[];
}

export interface NotificationLogEntry {
  id: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  recipientContact?: string | null;
  subject?: string | null;
  body: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  recipient?: CommsUserRef | null;
  campaign?: { id: string; title: string } | null;
}

export interface LogsResponse {
  logs: NotificationLogEntry[];
  summary: {
    total: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    failureRate: number;
  };
  channelRates: {
    channel: DeliveryChannel;
    total: number;
    delivered: number;
    deliveryRate: number;
  }[];
}

export interface CommsStats {
  notices: { published: number };
  circulars: { total: number };
  campaigns: { total: number; recent: BroadcastCampaignSummary[] };
  complaints: { open: number; byStatus: Record<string, number> };
  delivery: {
    last30Days: {
      total: number;
      delivered: number;
      deliveryRate: number;
    };
  };
}

export const AUDIENCE_ROLE_OPTIONS = [
  { value: 'PARENT', label: 'Parents' },
  { value: 'TEACHER', label: 'Teachers' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'SCHOOL_ADMIN', label: 'School Admin' },
  { value: 'RECEPTIONIST', label: 'Reception' },
] as const;

export const BROADCAST_CHANNEL_OPTIONS: { value: DeliveryChannel; label: string }[] = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'PUSH', label: 'Push Notification' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
];

export function commsUserName(user?: CommsUserRef | null): string {
  if (!user) return 'Unknown';
  return `${user.firstName} ${user.lastName}`.trim();
}

export function audienceSummary(filter: AudienceFilter): string {
  const parts: string[] = [];
  if (filter.roles?.length) {
    parts.push(
      filter.roles
        .map((role) => AUDIENCE_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role)
        .join(', '),
    );
  }
  if (filter.classIds?.length) {
    parts.push(`${filter.classIds.length} class(es)`);
  }
  if (filter.sectionIds?.length) {
    parts.push(`${filter.sectionIds.length} section(s)`);
  }
  return parts.length ? parts.join(' · ') : 'Entire school';
}
