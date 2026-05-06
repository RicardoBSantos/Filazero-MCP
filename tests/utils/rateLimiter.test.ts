import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SlidingWindowRateLimiter,
  RateLimitExceededError,
} from "../../src/utils/rateLimiter.js";

describe("SlidingWindowRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", () => {
    const limiter = new SlidingWindowRateLimiter(3, 60_000);

    expect(() => limiter.acquire()).not.toThrow();
    expect(() => limiter.acquire()).not.toThrow();
    expect(() => limiter.acquire()).not.toThrow();
    expect(limiter.remaining).toBe(0);
  });

  it("throws RateLimitExceededError when limit exceeded", () => {
    const limiter = new SlidingWindowRateLimiter(2, 60_000);

    limiter.acquire();
    limiter.acquire();

    expect(() => limiter.acquire()).toThrow(RateLimitExceededError);
    expect(() => limiter.acquire()).toThrow(/Limite de requisições excedido/);
  });

  it("allows requests again after window expires", () => {
    const limiter = new SlidingWindowRateLimiter(2, 60_000);

    limiter.acquire();
    limiter.acquire();
    expect(() => limiter.acquire()).toThrow(RateLimitExceededError);

    // Advance past the window
    vi.advanceTimersByTime(60_001);

    expect(() => limiter.acquire()).not.toThrow();
    expect(limiter.remaining).toBe(1);
  });

  it("sliding window expires oldest requests first", () => {
    const limiter = new SlidingWindowRateLimiter(2, 60_000);

    limiter.acquire(); // t=0
    vi.advanceTimersByTime(30_000);
    limiter.acquire(); // t=30s

    expect(() => limiter.acquire()).toThrow(RateLimitExceededError);

    // Advance so first request expires but second doesn't
    vi.advanceTimersByTime(30_001); // t=60.001s — first expired

    expect(() => limiter.acquire()).not.toThrow();
    expect(limiter.remaining).toBe(0); // second still in window + new one
  });

  it("remaining reflects current window state", () => {
    const limiter = new SlidingWindowRateLimiter(5, 60_000);

    expect(limiter.remaining).toBe(5);
    limiter.acquire();
    expect(limiter.remaining).toBe(4);

    vi.advanceTimersByTime(60_001);
    expect(limiter.remaining).toBe(5);
  });

  it("reset clears all tracked requests", () => {
    const limiter = new SlidingWindowRateLimiter(2, 60_000);

    limiter.acquire();
    limiter.acquire();
    expect(limiter.remaining).toBe(0);

    limiter.reset();
    expect(limiter.remaining).toBe(2);
    expect(() => limiter.acquire()).not.toThrow();
  });

  it("uses default 60s window when not specified", () => {
    const limiter = new SlidingWindowRateLimiter(1);

    limiter.acquire();
    expect(() => limiter.acquire()).toThrow(RateLimitExceededError);

    vi.advanceTimersByTime(60_001);
    expect(() => limiter.acquire()).not.toThrow();
  });

  it("error message includes retry-after in seconds", () => {
    const limiter = new SlidingWindowRateLimiter(1, 60_000);
    limiter.acquire();

    vi.advanceTimersByTime(10_000); // 10s elapsed, 50s remaining

    try {
      limiter.acquire();
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitExceededError);
      expect((error as Error).message).toMatch(/50 segundo/);
    }
  });
});
