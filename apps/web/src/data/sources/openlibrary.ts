import { ExternalItem, SearchOptions } from "./types";

type OLSearchDoc = {
  key?: string; // work key like "/works/OL123W"
  title?: string;
  cover_i?: number;
  author_name?: string[];
  first_publish_year?: number;
};

export async function searchOpenLibrary(q: string, limit = 5, _opts: SearchOptions = {}): Promise<ExternalItem[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const data = await res.json();
  const docs: OLSearchDoc[] = data?.docs ?? [];
  return docs
    .filter((d) => d.key && d.title)
    .slice(0, limit)
    .map((d) => ({
      source: "openlibrary",
      sourceId: d.key!,
      title: d.title!,
      type: "book",
      creator: Array.isArray(d.author_name) && d.author_name.length > 0 ? d.author_name[0] : null,
      year: typeof d.first_publish_year === "number" ? d.first_publish_year : null,
      imageUrl: d.cover_i ? coverUrl(d.cover_i) : null,
      url: d.key ? `https://openlibrary.org${d.key}` : null,
    }));
}

function coverUrl(coverId: number, size: "S" | "M" | "L" = "M") {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}
