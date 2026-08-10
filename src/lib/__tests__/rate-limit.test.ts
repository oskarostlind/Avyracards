import { afterEach, describe, expect, it, vi } from "vitest";

import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * Rate limiting skyddar claim-flödet och publika avatar-/profilroutes
 * mot brute force på kortkoder (ClickUp 86c6rbe2j).
 */

afterEach(() => {
  vi.useRealTimers();
});

const options = { windowMs: 60_000, max: 3 };

function uniqueKey(name: string) {
  return `${name}:${Math.random().toString(36).slice(2)}`;
}

describe("consumeRateLimit", () => {
  it("släpper igenom upp till max och blockerar därefter", () => {
    const key = uniqueKey("claim");

    expect(consumeRateLimit(key, options)).toEqual({ allowed: true, remaining: 2 });
    expect(consumeRateLimit(key, options)).toEqual({ allowed: true, remaining: 1 });
    expect(consumeRateLimit(key, options)).toEqual({ allowed: true, remaining: 0 });
    expect(consumeRateLimit(key, options)).toEqual({ allowed: false, remaining: 0 });
  });

  it("håller isär olika nycklar", () => {
    const a = uniqueKey("a");
    const b = uniqueKey("b");

    for (let i = 0; i < options.max; i += 1) consumeRateLimit(a, options);

    expect(consumeRateLimit(a, options).allowed).toBe(false);
    expect(consumeRateLimit(b, options).allowed).toBe(true);
  });

  it("nollställer fönstret när tiden har gått ut", () => {
    vi.useFakeTimers();
    const key = uniqueKey("window");

    for (let i = 0; i < options.max; i += 1) consumeRateLimit(key, options);
    expect(consumeRateLimit(key, options).allowed).toBe(false);

    vi.advanceTimersByTime(options.windowMs + 1);

    expect(consumeRateLimit(key, options)).toEqual({ allowed: true, remaining: 2 });
  });
});
