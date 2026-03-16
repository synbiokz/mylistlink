import { z } from "zod";

export const BookSearchResultSchema = z.object({
  source: z.literal("openlibrary"),
  sourceId: z.string(),
  title: z.string(),
  authorName: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  publicationYear: z.number().int().nullable().optional(),
  genrePrimary: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});
export type BookSearchResult = z.infer<typeof BookSearchResultSchema>;

export const BookSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  canonicalTitle: z.string(),
  authorName: z.string(),
  coverUrl: z.string().nullable().optional(),
});
export type Book = z.infer<typeof BookSchema>;

export const SlotSchema = z.object({
  position: z.number().int(),
  bookId: z.number().int().nullable(),
  title: z.string().nullable(),
  slug: z.string().nullable(),
  authorName: z.string().nullable(),
  coverUrl: z.string().nullable(),
});
export type Slot = z.infer<typeof SlotSchema>;

export const DraftSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable().optional(),
  slots: z.array(SlotSchema).optional(),
});
export type Draft = z.infer<typeof DraftSchema>;

export const SessionSchema = z.object({
  user: z.object({ id: z.number().int(), email: z.string().nullable(), name: z.string().nullable() }),
});
export type Session = z.infer<typeof SessionSchema>;

export const SlotSnapshotResponseSchema = z.object({ slots: z.array(SlotSchema) });
export const DraftCreateResponseSchema = z.object({ list: z.object({ id: z.number().int(), slug: z.string() }) });
export const LatestDraftResponseSchema = z.object({ draft: DraftSchema.nullable() });
export const BookResolveResponseSchema = z.object({ bookId: z.number().int(), slug: z.string(), book: BookSchema.optional() });
export const BookSearchResponseSchema = z.object({ q: z.string(), books: z.array(BookSearchResultSchema) });
