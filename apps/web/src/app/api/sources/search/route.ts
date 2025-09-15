import { NextResponse } from "next/server";
import { federatedSearch } from "@/data/sources";
import { getRequestId, withRequestId } from "@/lib/request";
import { rateLimit } from "@/lib/limits";

// Simple in-memory cache keyed by q+type for short TTL.
type CacheVal = { at: number; items: any[] };
const CACHE = new Map<string, CacheVal>();
const TTL_MS = 30_000;

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim() || q.trim().length < 3) return withRequestId(NextResponse.json({ q, items: [] }), requestId);
  const type = searchParams.get("type") ?? undefined;
  const year = searchParams.get("year");
  const limit = searchParams.get("limit");
  const ip = (req.headers as any)?.get?.("x-forwarded-for") || "local";
  if (!rateLimit(`src:${ip}`, 90, 40)) {
    return withRequestId(NextResponse.json({ error: { code: "RATE_LIMIT" } }, { status: 429 }), requestId);
  }

  const cacheKey = `${q}::${type || "all"}`;
  const now = Date.now();
  const cached = CACHE.get(cacheKey);
  if (cached && now - cached.at < TTL_MS) {
    return withRequestId(NextResponse.json({ q, items: cached.items, cached: true }), requestId);
  }

  const t0 = Date.now();
  const items = await federatedSearch(q, {
    type: type as any,
    year: year ? Number(year) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  CACHE.set(cacheKey, { at: now, items });
  const resp = NextResponse.json({ q, items, latencyMs: Date.now() - t0 });
  return withRequestId(resp, requestId);
}
