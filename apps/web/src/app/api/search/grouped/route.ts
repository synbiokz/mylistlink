import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { federatedSearch } from "@/data/sources";
import type { ExternalItem, SearchOptions } from "@/data/sources/types";
import type { GroupedSearchResponse, GroupedWorkItem } from "@/types/search-grouped";
import { getRequestId, withRequestId } from "@/lib/request";

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapKind(it: ExternalItem): GroupedWorkItem["kind"] {
  const t = (it.type || "").toLowerCase();
  if (it.source === "openlibrary") return "Book";
  if (it.source === "omdb") {
    if (t === "movie") return "Movie";
    if (t === "series") return "TVSeries";
    if (t === "episode") return "Episode";
    return "Other";
  }
  return "Other";
}

function authorityKey(it: ExternalItem): { key: string | null; ids: { authority: string; extId: string }[] } {
  if (it.source === "openlibrary" && it.sourceId.startsWith("/works/")) {
    return { key: `olw:${it.sourceId}`, ids: [{ authority: "openlibrary_work", extId: it.sourceId }] };
  }
  if (it.source === "omdb" && it.sourceId) {
    return { key: `imdb:${it.sourceId}`, ids: [{ authority: "imdb", extId: it.sourceId }] };
  }
  if (it.source === "wikidata" && it.sourceId) {
    return { key: `wd:${it.sourceId}`, ids: [{ authority: "wikidata", extId: it.sourceId }] };
  }
  return { key: null, ids: [] };
}

function pickRepresentative(items: ExternalItem[], kind: GroupedWorkItem["kind"]): ExternalItem {
  // Prefer by source per kind, then by image presence
  const order = kind === "Book" ? ["openlibrary", "wikidata", "omdb"] : kind === "Movie" || kind === "TVSeries" || kind === "Episode" ? ["omdb", "wikidata", "openlibrary"] : ["wikidata", "openlibrary", "omdb"];
  const sorted = [...items].sort((a, b) => {
    const as = order.indexOf(a.source);
    const bs = order.indexOf(b.source);
    if (as !== bs) return as - bs;
    const ai = a.imageUrl ? 0 : 1;
    const bi = b.imageUrl ? 0 : 1;
    if (ai !== bi) return ai - bi;
    return (b.title?.length || 0) - (a.title?.length || 0);
  });
  return sorted[0];
}

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q || q.length < 2) return withRequestId(NextResponse.json({ q, items: [] } as GroupedSearchResponse), requestId);
  const type = searchParams.get("type") || undefined;
  const limit = Number(searchParams.get("limit") || 20);
  const expand = searchParams.get("expand") === "1";
  // Simple in-memory cache (per instance) to reduce repeated upstream calls during typing
  const key = `${normalize(q)}::${type || "all"}::${expand ? 1 : 0}::${limit}`;
  const now = Date.now();
  const cached = CACHE.get(key);
  if (cached && now - cached.at < TTL_MS) {
    return withRequestId(NextResponse.json({ q, items: cached.items } as GroupedSearchResponse), requestId);
  }

  const opts: SearchOptions = { type: type as any, limit };
  const raw = await federatedSearch(q, opts);

  // Cluster by authority key or fallback normalized key
  const clusters = new Map<string, { items: ExternalItem[]; kind: GroupedWorkItem["kind"]; authIds: { authority: string; extId: string }[]; confidence: number }>();
  for (const it of raw) {
    const kind = mapKind(it);
    const auth = authorityKey(it);
    let key: string;
    let confidence = 1.0;
    let ids = auth.ids;
    if (auth.key) {
      key = `${kind}:${auth.key}`;
    } else {
      const tN = normalize(it.title);
      const cN = normalize(it.creator || "");
      key = `${kind}:norm:${tN}|${cN}`;
      // Lower confidence without strong authority
      confidence = cN ? 0.7 : 0.4;
      ids = [];
    }
    const bucket = clusters.get(key);
    if (!bucket) clusters.set(key, { items: [it], kind, authIds: ids, confidence });
    else {
      bucket.items.push(it);
      bucket.authIds.push(...ids);
      // keep min confidence (more conservative)
      bucket.confidence = Math.min(bucket.confidence, confidence);
    }
  }
  // Cross-authority merge: combine clusters with same normalized (title, creator) within the same kind
  const mergedByNorm = new Map<string, { items: ExternalItem[]; kind: GroupedWorkItem["kind"]; authIds: { authority: string; extId: string }[]; confidence: number }>();
  for (const [, group] of clusters) {
    const rep = pickRepresentative(group.items, group.kind);
    const tN = normalize(rep.title);
    const cN = normalize(rep.creator || "");
    const mkey = `${group.kind}:norm2:${tN}|${cN}`;
    const bucket = mergedByNorm.get(mkey);
    if (!bucket) mergedByNorm.set(mkey, { items: [...group.items], kind: group.kind, authIds: [...group.authIds], confidence: group.confidence });
    else {
      bucket.items.push(...group.items);
      bucket.authIds.push(...group.authIds);
      bucket.confidence = Math.max(bucket.confidence, group.confidence);
    }
  }

  const out: GroupedWorkItem[] = [];
  for (const [, group] of mergedByNorm) {
    const rep = pickRepresentative(group.items, group.kind);
    // Try to find WorkId if we have a primary authority (prefer openlibrary_work)
    let workId: number | null = null;
    const uniqueIds = [...new Map(group.authIds.map((a) => [`${a.authority}:${a.extId}`, a])).values()];
    const prefId = uniqueIds.find((a) => a.authority === "openlibrary_work") || uniqueIds[0];
    if (prefId) {
      try {
        const eid = await prisma.externalId.findUnique({ where: { authority_extId: { authority: prefId.authority, extId: prefId.extId } } });
        if (eid) workId = eid.workId;
      } catch {}
    }
    const versions = expand
      ? group.items.map((it) => ({
          source: it.source,
          sourceId: it.sourceId,
          title: it.title,
          imageUrl: it.imageUrl ?? null,
          year: it.year ?? null,
          lang: null as string | null,
        }))
      : undefined;
    out.push({
      workId,
      kind: group.kind,
      title: rep.title,
      creator: rep.creator ?? null,
      year: rep.year ?? null,
      imageUrl: rep.imageUrl ?? null,
      authorities: uniqueIds,
      confidence: group.confidence,
      hasMoreVersions: group.items.length > 1,
      versions,
    });
  }

  // Save to cache
  CACHE.set(key, { at: now, items: out });
  const resp: GroupedSearchResponse = { q, items: out };
  return withRequestId(NextResponse.json(resp), requestId);
}

// simple per-instance cache for 30s
type CacheEntry = { at: number; items: GroupedWorkItem[] };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 30000;
