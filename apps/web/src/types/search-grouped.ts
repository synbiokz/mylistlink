export type AuthorityId = {
  authority: 'openlibrary_work' | 'openlibrary_edition' | 'wikidata' | 'imdb' | string;
  extId: string;
};

export type GroupedWorkItem = {
  workId: number | null;
  kind: 'Book' | 'Movie' | 'TVSeries' | 'Episode' | 'Comic' | 'Game' | 'Album' | 'Track' | 'Other';
  title: string;
  creator?: string | null;
  year?: number | null;
  imageUrl?: string | null;
  authorities: AuthorityId[];
  confidence: number; // 0..1
  hasMoreVersions: boolean;
  versions?: Array<{
    source: 'openlibrary' | 'omdb' | 'wikidata' | string;
    sourceId: string;
    title: string;
    imageUrl?: string | null;
    year?: number | null;
    lang?: string | null;
  }>;
};

export type GroupedSearchResponse = {
  q: string;
  items: GroupedWorkItem[];
};

