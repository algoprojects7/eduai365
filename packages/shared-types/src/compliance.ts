export interface UserConsentStatus {
  userId: string;
  dataProcessing: boolean;
  marketing: boolean;
  analytics: boolean;
  communications: boolean;
  thirdPartySharing: boolean;
  dataProcessingAt: string | null;
  marketingAt: string | null;
  analyticsAt: string | null;
  communicationsAt: string | null;
  thirdPartySharingAt: string | null;
  updatedAt: string | null;
}

export interface RecordConsentInput {
  dataProcessing?: boolean;
  marketing?: boolean;
  analytics?: boolean;
  communications?: boolean;
  thirdPartySharing?: boolean;
}

export interface UserDataExport {
  exportedAt: string;
  userId: string;
  profile: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    isActive: boolean;
    mfaEnabled: boolean;
    lastLoginAt: string | null;
    deletionRequestedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  school: { id: string; name: string; slug: string } | null;
  consent: UserConsentStatus;
  devices: Array<{
    id: string;
    fingerprint: string;
    name: string | null;
    lastUsedAt: string;
    isTrusted: boolean;
    createdAt: string;
  }>;
  loginHistory: Array<{
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    success: boolean;
    failureReason: string | null;
    createdAt: string;
  }>;
  sessions: Array<{
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    expiresAt: string;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    read: boolean;
    link: string | null;
    createdAt: string;
  }>;
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    status: string;
    classId: string | null;
    sectionId: string | null;
  } | null;
  employee: {
    id: string;
    employeeId: string;
    department: string;
    designation: string;
    joinDate: string;
    employmentType: string;
  } | null;
}

export interface AccountDeletionResult {
  requestedAt: string;
  status: 'pending';
}
