import type { TenantContext } from '@eduai365/shared-types';
import { config } from '@eduai365/config';

export type WebhookProvider = 'razorpay' | 'cashfree' | 'payu' | 'phonepe' | 'stripe';

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
  status: 'processed' | 'failed' | 'ignored';
  payloadSummary: string;
  receivedAt: string;
}

const PROVIDER_LABELS: Record<WebhookProvider, string> = {
  razorpay: 'Razorpay',
  cashfree: 'Cashfree',
  payu: 'PayU',
  phonepe: 'PhonePe',
  stripe: 'Stripe',
};

const LIVE_WEBHOOK_PROVIDERS: WebhookProvider[] = ['razorpay', 'cashfree'];

export function buildPaymentWebhookEndpoints(tenant: TenantContext): PaymentWebhookEndpoint[] {
  const base = `${config.apiUrl}/api/v1/integrations/webhooks`;

  return (Object.keys(PROVIDER_LABELS) as WebhookProvider[]).map((provider) => ({
    provider,
    label: PROVIDER_LABELS[provider],
    url: LIVE_WEBHOOK_PROVIDERS.includes(provider)
      ? `${base}/${provider}`
      : `${base}/inbound/${provider}/${tenant.slug}`,
    description: `Configure in ${PROVIDER_LABELS[provider]}. Include X-Tenant-Slug: ${tenant.slug} on each request.`,
  }));
}

function seedFrom(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function buildWebhookEventLogs(tenant: TenantContext): WebhookEventLog[] {
  const seed = seedFrom(`${tenant.schoolId}-webhooks`);
  const now = Date.now();

  const events: Array<Omit<WebhookEventLog, 'id' | 'receivedAt'>> = [
    {
      provider: 'razorpay',
      eventType: 'payment.captured',
      status: 'processed',
      payloadSummary: 'Fee invoice INV-2026-0142 — ₹12,500 captured',
    },
    {
      provider: 'razorpay',
      eventType: 'payment.failed',
      status: 'failed',
      payloadSummary: 'Card declined for admission fee — insufficient funds',
    },
    {
      provider: 'cashfree',
      eventType: 'PAYMENT_SUCCESS',
      status: 'processed',
      payloadSummary: 'Term II transport fee — ₹4,200 settled',
    },
    {
      provider: 'payu',
      eventType: 'refund.processed',
      status: 'processed',
      payloadSummary: 'Partial refund ₹1,000 for duplicate challan payment',
    },
    {
      provider: 'stripe',
      eventType: 'checkout.session.completed',
      status: 'processed',
      payloadSummary: 'International parent fee — USD 850 converted',
    },
    {
      provider: 'phonepe',
      eventType: 'PAYMENT_PENDING',
      status: 'ignored',
      payloadSummary: 'UPI collect request expired before confirmation',
    },
    {
      provider: 'cashfree',
      eventType: 'PAYMENT_FAILED',
      status: 'failed',
      payloadSummary: 'Net banking session timed out for hostel deposit',
    },
    {
      provider: 'razorpay',
      eventType: 'subscription.charged',
      status: 'processed',
      payloadSummary: 'Monthly meal plan auto-debit — ₹3,600',
    },
  ];

  return events.map((event, index) => ({
    ...event,
    id: `wh-${tenant.slug}-${index + 1}`,
    receivedAt: new Date(now - ((seed % 7) + index + 1) * 45 * 60_000).toISOString(),
  }));
}
