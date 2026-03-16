export type ExternalBook = {
  source: "openlibrary";
  sourceId: string;
  title: string;
  authorName?: string | null;
  coverUrl?: string | null;
  publicationYear?: number | null;
  genrePrimary?: string | null;
  url?: string | null;
};
