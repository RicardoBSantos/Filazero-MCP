import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Cache } from "../../src/cache/index.js";

describe("Cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna null para chave inexistente", () => {
    const cache = new Cache<string>();
    expect(cache.get("x")).toBeNull();
  });

  it("retorna valor antes do TTL expirar", () => {
    const cache = new Cache<number>();
    cache.set("key", 42, 60);
    expect(cache.get("key")).toBe(42);
  });

  it("retorna null apos TTL expirar", () => {
    const cache = new Cache<number>();
    cache.set("key", 42, 60);
    vi.advanceTimersByTime(61_000);
    expect(cache.get("key")).toBeNull();
  });

  it("remove entrada expirada do store interno", () => {
    const cache = new Cache<string>();
    cache.set("k", "v", 10);
    vi.advanceTimersByTime(11_000);
    cache.get("k"); // acessa para disparar delete
    // segundo get confirma remocao
    expect(cache.get("k")).toBeNull();
  });

  it("sobrescreve valor com novo TTL ao setar mesma chave", () => {
    const cache = new Cache<string>();
    cache.set("k", "primeiro", 10);
    cache.set("k", "segundo", 120);
    vi.advanceTimersByTime(11_000);
    expect(cache.get("k")).toBe("segundo");
  });

  it("isola valores por chave diferente", () => {
    const cache = new Cache<string>();
    cache.set("a", "alpha", 60);
    cache.set("b", "beta", 60);
    expect(cache.get("a")).toBe("alpha");
    expect(cache.get("b")).toBe("beta");
  });

  it("expira chaves independentemente", () => {
    const cache = new Cache<string>();
    cache.set("curta", "x", 5);
    cache.set("longa", "y", 100);
    vi.advanceTimersByTime(6_000);
    expect(cache.get("curta")).toBeNull();
    expect(cache.get("longa")).toBe("y");
  });

  it("aceita TTL zero — expira imediatamente", () => {
    const cache = new Cache<string>();
    cache.set("k", "v", 0);
    vi.advanceTimersByTime(1);
    expect(cache.get("k")).toBeNull();
  });
});
