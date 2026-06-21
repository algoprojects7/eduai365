import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

export type WebhookProvider = 'razorpay' | 'cashfree';

@Injectable()
export class WebhookSignatureService {
  private readonly logger = new Logger(WebhookSignatureService.name);

  /**
   * HMAC signature verification stub.
   * When webhook secrets are configured, validates the provider signature header.
   * Otherwise logs a warning and accepts the payload (dev/stub mode).
   */
  verify(
    provider: WebhookProvider,
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ): void {
    const secret = this.resolveSecret(provider);
    const signature = this.extractSignature(provider, headers);

    if (!secret) {
      this.logger.warn(
        `${provider} webhook secret not configured — skipping HMAC verification (stub mode)`,
      );
      return;
    }

    if (!signature) {
      throw new UnauthorizedException(`Missing ${provider} webhook signature header`);
    }

    const expected = this.computeSignature(provider, rawBody, secret);
    const received = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');

    if (
      received.length !== expectedBuf.length ||
      !timingSafeEqual(received, expectedBuf)
    ) {
      throw new UnauthorizedException(`Invalid ${provider} webhook signature`);
    }
  }

  private resolveSecret(provider: WebhookProvider): string | undefined {
    if (provider === 'razorpay') {
      return process.env.RAZORPAY_WEBHOOK_SECRET;
    }
    return process.env.CASHFREE_WEBHOOK_SECRET;
  }

  private extractSignature(
    provider: WebhookProvider,
    headers: Record<string, string | string[] | undefined>,
  ): string | undefined {
    const headerName =
      provider === 'razorpay' ? 'x-razorpay-signature' : 'x-webhook-signature';
    const value = headers[headerName];
    return typeof value === 'string' ? value : undefined;
  }

  private computeSignature(
    provider: WebhookProvider,
    rawBody: string,
    secret: string,
  ): string {
    const algorithm = provider === 'razorpay' ? 'sha256' : 'sha256';
    return createHmac(algorithm, secret).update(rawBody).digest('hex');
  }
}
