import { ExternalItem, SearchOptions } from "./types";

export async function searchWikidata(q: string, limit = 5, _opts: SearchOptions = {}): Promise<ExternalItem[]> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=en&uselang=en&format=json&limit=${limit}&origin=*`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  const search: any[] = data?.search ?? [];
  return search.slice(0, limit).map((s) => ({
    source: "wikidata",
    sourceId: s.id,
    title: s.label,
    type: s.description,
    imageUrl: null,
    url: `https://www.wikidata.org/wiki/${s.id}`,
  }));
}
