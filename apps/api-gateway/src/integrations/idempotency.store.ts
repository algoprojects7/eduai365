import { Injectable, Logger } from '@nestjs/common';

interface StoredEntry {
  expiresAt: number;
}

/**
 * In-memory idempotency store for webhook deduplication.
 * Swap for Redis when REDIS_URL is configured in production.
 */
@Injectable()
export class IdempotencyStore {
  private readonly logger = new Logger(IdempotencyStore.name);
  private readonly entries = new Map<string, StoredEntry>();
  private readonly defaultTtlMs = 24 * 60 * 60 * 1000;

  async claim(key: string, ttlMs = this.defaultTtlMs): Promise<boolean> {
    this.pruneExpired();

    if (this.entries.has(key)) {
      return false;
    }

    this.entries.set(key, { expiresAt: Date.now() + ttlMs });
    return true;
  }

  async release(key: string): Promise<void> {
    this.entries.delete(key);
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }
}
