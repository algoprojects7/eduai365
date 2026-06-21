export type WebhookProvider = 'razorpay' | 'cashfree' | 'payu' | 'phonepe' | 'stripe';

export type WebhookEventStatus = 'processed' | 'failed' | 'ignored';

export interface PaymentWebhookEndpoint {
  provider: WebhookProvider;
  label: string;
  url: string;
  description: string;
}

export interface WebhookEventLog {
  id: string;
  provider: WebhookProvider;
  eventType: string;
  status: WebhookEventStatus;
  payloadSummary: string;
  receivedAt: string;
}

export interface QrAttendanceInput {
  studentId: string;
  timestamp: string;
}

export interface QrAttendanceResult {
  studentId: string;
  studentName: string;
  admissionNo: string;
  status: string;
  date: string;
  scannedAt: string;
  source: 'qr';
}

export interface TestMessageInput {
  to: string;
  message: string;
}

export interface TestMessageResult {
  provider: string;
  messageId: string;
  to: string;
  status: 'queued';
  mock: true;
}

export const WEBHOOK_PROVIDER_LABELS: Record<WebhookProvider, string> = {
  razorpay: 'Razorpay',
  cashfree: 'Cashfree',
  payu: 'PayU',
  phonepe: 'PhonePe',
  stripe: 'Stripe',
};

export const WEBHOOK_STATUS_LABELS: Record<WebhookEventStatus, string> = {
  processed: 'Processed',
  failed: 'Failed',
  ignored: 'Ignored',
};
