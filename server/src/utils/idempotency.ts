/**
 * In-memory idempotency store for preventing duplicate updates.
 * Stores operation IDs and their cached results with a 24-hour TTL.
 */

interface CachedOperation {
  statusCode: number;
  data: unknown;
  timestamp: number;
}

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class IdempotencyStore {
  private cache = new Map<string, CachedOperation>();

  constructor() {
    // Periodic sweep every 30 minutes to clean up expired operation IDs
    setInterval(() => this.cleanup(), 30 * 60 * 1000).unref();
  }

  get(opId: string): CachedOperation | undefined {
    const cached = this.cache.get(opId);
    if (!cached) return undefined;

    if (Date.now() - cached.timestamp > TTL_MS) {
      this.cache.delete(opId);
      return undefined;
    }

    return cached;
  }

  set(opId: string, statusCode: number, data: unknown): void {
    this.cache.set(opId, {
      statusCode,
      data,
      timestamp: Date.now(),
    });
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [opId, cached] of this.cache.entries()) {
      if (now - cached.timestamp > TTL_MS) {
        this.cache.delete(opId);
      }
    }
  }
}

export const idempotencyStore = new IdempotencyStore();
