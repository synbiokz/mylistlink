// Lightweight in-memory rate limiters for M1.

type Bucket = { tokens: number; last: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, ratePerMin: number, burst?: number): boolean {
  const now = Date.now();
  const capacity = burst ?? ratePerMin;
  const refillPerMs = ratePerMin / 60000; // tokens per ms
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: capacity, last: now };
    buckets.set(key, b);
  }
  // refill
  const elapsed = now - b.last;
  b.tokens = Math.min(capacity, b.tokens + elapsed * refillPerMs);
  b.last = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return true;
  }
  return false;
}

