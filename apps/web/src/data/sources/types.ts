export type ExternalSource = "openlibrary" | "omdb" | "wikidata";

export type ExternalItem = {
  source: ExternalSource;
  sourceId: string;
  title: string;
  type?: string;
  imageUrl?: string | null;
  creator?: string | null;
  year?: number | null;
  summary?: string | null;
  url?: string | null;
};

export type SearchType = "book" | "movie" | "series" | "episode" | "entity" | "all";

export type SearchOptions = {
  type?: SearchType;
  limit?: number;
  year?: number;
};
