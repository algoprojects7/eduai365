import type {
  AccountDeletionResult,
  RecordConsentInput,
  UserConsentStatus,
  UserDataExport,
} from '@eduai365/shared-types';

export type {
  AccountDeletionResult,
  RecordConsentInput,
  UserConsentStatus,
  UserDataExport,
};

export const CONSENT_LABELS: Record<
  keyof Pick<
    UserConsentStatus,
    'dataProcessing' | 'marketing' | 'analytics' | 'communications' | 'thirdPartySharing'
  >,
  { label: string; description: string; required?: boolean }
> = {
  dataProcessing: {
    label: 'Data processing',
    description: 'Allow EduCore to process your personal data to deliver school services.',
    required: true,
  },
  marketing: {
    label: 'Marketing',
    description: 'Receive product updates, newsletters, and promotional messages.',
  },
  analytics: {
    label: 'Analytics',
    description: 'Help improve EduCore with anonymised usage analytics.',
  },
  communications: {
    label: 'Communications',
    description: 'Receive SMS, email, and push notifications from your school.',
  },
  thirdPartySharing: {
    label: 'Third-party sharing',
    description: 'Share data with approved third-party integrations configured by your school.',
  },
};
