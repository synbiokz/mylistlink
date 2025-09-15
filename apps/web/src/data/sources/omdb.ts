import { ExternalItem, SearchOptions } from "./types";

const API = "https://www.omdbapi.com/";

export async function searchOmdb(q: string, limit = 5, opts: SearchOptions = {}): Promise<ExternalItem[]> {
  const key = process.env.OMDB_API_KEY;
  if (!key) return [];

  // If q looks like an IMDb ID, fetch exact by ID
  if (/^tt\d{5,}$/.test(q)) {
    const byId = await fetchJson(`${API}?apikey=${key}&i=${encodeURIComponent(q)}&plot=short`);
    if (byId?.Response === "True") {
      return [mapOmdbItem(byId)];
    }
    return [];
  }

  // If query contains spaces (likely full title), try exact title first
  if (q.includes(" ")) {
    const typeParam = opts.type && ["movie", "series", "episode"].includes(opts.type) ? `&type=${opts.type}` : "";
    const byTitle = await fetchJson(`${API}?apikey=${key}&t=${encodeURIComponent(q)}${typeParam}&plot=short`);
    if (byTitle?.Response === "True") {
      return [mapOmdbItem(byTitle)];
    }
  }

  const typeParam = opts.type && ["movie", "series", "episode"].includes(opts.type) ? `&type=${opts.type}` : "";
  const yearParam = opts.year ? `&y=${opts.year}` : "";

  const pageSize = 10; // OMDb returns 10 per page
  const pages = Math.ceil(limit / pageSize);
  const results: ExternalItem[] = [];

  for (let page = 1; page <= pages; page++) {
    const url = `${API}?apikey=${key}&s=${encodeURIComponent(q)}${typeParam}${yearParam}&page=${page}`;
    const data = await fetchJson(url);
    if (!data) break;
    if (data.Response !== "True") {
      // Stop on error (too many requests, not found, etc.)
      break;
    }
    const items: any[] = data.Search ?? [];
    for (const i of items) {
      results.push(mapOmdbItem(i));
      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
    // If fewer than pageSize returned, no more pages
    if (items.length < pageSize) break;
  }
  return results;
}

function mapOmdbItem(i: any): ExternalItem {
  const imdbID = i.imdbID ?? i.imdbId ?? i.id;
  const yr = i.Year ? parseInt(String(i.Year), 10) : undefined;
  return {
    source: "omdb",
    sourceId: imdbID,
    title: i.Title ?? i.title ?? "",
    type: i.Type ?? i.type,
    year: Number.isFinite(yr) ? (yr as number) : undefined,
    imageUrl: i.Poster && i.Poster !== "N/A" ? i.Poster : null,
    url: imdbID ? `https://www.imdb.com/title/${imdbID}` : null,
  };
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
