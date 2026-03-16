import type { ExternalBook } from "./types";

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  cover_i?: number;
  author_name?: string[];
  first_publish_year?: number;
  subject?: string[];
};

export async function searchOpenLibrary(q: string, limit = 8): Promise<ExternalBook[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];

  const data = await res.json();
  const docs: OpenLibraryDoc[] = data?.docs ?? [];

  return docs
    .filter((doc) => doc.key && doc.title)
    .slice(0, limit)
    .map((doc) => ({
      source: "openlibrary" as const,
      sourceId: doc.key!,
      title: doc.title!,
      authorName: Array.isArray(doc.author_name) && doc.author_name.length > 0 ? doc.author_name[0] : null,
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      publicationYear: typeof doc.first_publish_year === "number" ? doc.first_publish_year : null,
      genrePrimary: Array.isArray(doc.subject) && doc.subject.length > 0 ? doc.subject[0] : null,
      url: `https://openlibrary.org${doc.key}`,
    }));
}
