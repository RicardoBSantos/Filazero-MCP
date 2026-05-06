import { logger } from "./logger.js";

export class RateLimitExceededError extends Error {
  constructor(retryAfterMs: number) {
    const seconds = Math.ceil(retryAfterMs / 1000);
    super(
      `Limite de requisições excedido. Tente novamente em ${seconds} segundo(s).`,
    );
    this.name = "RateLimitExceededError";
  }
}

export class SlidingWindowRateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed. If allowed, records it and returns.
   * If not, throws RateLimitExceededError with retry-after info.
   */
  acquire(): void {
    const now = Date.now();
    this.pruneExpired(now);

    if (this.timestamps.length >= this.maxRequests) {
      const oldestInWindow = this.timestamps[0];
      const retryAfterMs = oldestInWindow + this.windowMs - now;

      logger.warn("Rate limit exceeded", {
        maxRequests: this.maxRequests,
        windowMs: this.windowMs,
        currentCount: this.timestamps.length,
        retryAfterMs,
      });

      throw new RateLimitExceededError(retryAfterMs);
    }

    this.timestamps.push(now);
  }

  get remaining(): number {
    this.pruneExpired(Date.now());
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  reset(): void {
    this.timestamps = [];
  }

  private pruneExpired(now: number): void {
    const cutoff = now - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] <= cutoff) {
      this.timestamps.shift();
    }
  }
}
