import { searchOpenLibrary } from "./openlibrary";
import { searchOmdb } from "./omdb";
import { searchWikidata } from "./wikidata";
import type { ExternalItem, ExternalSource, SearchOptions, SearchType } from "./types";

export async function federatedSearch(
  q: string,
  opts: SearchOptions = {},
  sources: ExternalSource[] = defaultSourcesForType(opts.type)
) {
  const limitPer = opts.limit ?? 5;
  const tasks: Promise<ExternalItem[]>[] = [];
  if (sources.includes("openlibrary")) tasks.push(searchOpenLibrary(q, limitPer, opts));
  if (sources.includes("omdb")) tasks.push(searchOmdb(q, limitPer, opts));
  if (sources.includes("wikidata")) tasks.push(searchWikidata(q, limitPer, opts));
  const results = await Promise.allSettled(tasks);
  const items: ExternalItem[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const it of r.value) {
      const key = `${it.source}:${it.sourceId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(it);
    }
  }

  // Normalized-title coalescing with preferred authority order.
  // Goal: Avoid showing near-identical entries across sources; pick the best per title.
  function normalizeTitle(s: string) {
    return (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function prefScore(it: ExternalItem): number {
    const t = (it.type || "").toLowerCase();
    const s = it.source;
    // Preferred ranking by intent
    if (t === "book") {
      // Prefer OpenLibrary for books
      if (s === "openlibrary") return 0;
      if (s === "wikidata") return 1;
      if (s === "omdb") return 2;
    } else if (t === "movie" || t === "series" || t === "episode") {
      // Prefer OMDb (IMDb) for film/TV
      if (s === "omdb") return 0;
      if (s === "wikidata") return 1;
      if (s === "openlibrary") return 2;
    } else {
      // Generic: prefer Wikidata as a hub, then domain-specific
      if (s === "wikidata") return 0;
      if (s === "openlibrary") return 1;
      if (s === "omdb") return 1;
    }
    return 3;
  }

  const byTitle = new Map<string, ExternalItem[]>();
  for (const it of items) {
    const norm = normalizeTitle(it.title);
    if (!byTitle.has(norm)) byTitle.set(norm, []);
    byTitle.get(norm)!.push(it);
  }

  const coalesced: ExternalItem[] = [];
  for (const group of byTitle.values()) {
    // Pick best by score; if tie, prefer one with image, else first
    let best = group[0];
    let bestScore = prefScore(best);
    for (let i = 1; i < group.length; i++) {
      const cur = group[i];
      const score = prefScore(cur);
      if (
        score < bestScore ||
        (score === bestScore && !!cur.imageUrl && !best.imageUrl)
      ) {
        best = cur;
        bestScore = score;
      }
    }
    coalesced.push(best);
  }

  return coalesced;
}

export type { ExternalItem, ExternalSource, SearchOptions, SearchType };

function defaultSourcesForType(t?: SearchType): ExternalSource[] {
  switch (t) {
    case "book":
      return ["openlibrary"];
    case "movie":
    case "series":
    case "episode":
      return ["omdb"];
    case "entity":
      return ["wikidata"];
    default:
      return ["openlibrary", "omdb", "wikidata"];
  }
}
