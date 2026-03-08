type RateEntry = {
  windowStart: number;
  count: number;
};

export type RateLimitOptions = {
  windowMs: number;
  max: number;
};

const buckets = new Map<string, RateEntry>();

export function consumeRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart > options.windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    return {
      allowed: true,
      remaining: options.max - 1,
    };
  }

  if (existing.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: options.max - existing.count,
  };
}

