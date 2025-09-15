import { z } from "zod";

// External search item (from /api/sources/search)
export const SearchItemSchema = z.object({
  source: z.string(),
  sourceId: z.string(),
  title: z.string(),
  type: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});
export type SearchItem = z.infer<typeof SearchItemSchema>;

// Local Item
export const ItemSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});
export type Item = z.infer<typeof ItemSchema>;

// Slot snapshot returned by authoring endpoints
export const SlotSchema = z.object({
  position: z.number().int(),
  itemId: z.number().int().nullable(),
  title: z.string().nullable(),
  slug: z.string().nullable(),
  url: z.string().nullable(),
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

export const ListSummarySchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
});
export type ListSummary = z.infer<typeof ListSummarySchema>;

export const OverlapSchema = z.object({
  list: ListSummarySchema,
  overlap: z.number().int(),
  similarity: z.number(),
});
export type Overlap = z.infer<typeof OverlapSchema>;

// Auth session (subset used in UI)
export const SessionSchema = z.object({
  user: z.object({ id: z.number().int(), email: z.string().nullable(), name: z.string().nullable() }),
});
export type Session = z.infer<typeof SessionSchema>;

// Response wrappers
export const SlotsResponseSchema = z.object({ slots: z.array(SlotSchema) });
export const CreateDraftResponseSchema = z.object({ list: z.object({ id: z.number().int(), slug: z.string() }) });
export const LatestDraftResponseSchema = z.object({ draft: DraftSchema.nullable() });
export const ResolveItemResponseSchema = z.object({ itemId: z.number().int(), slug: z.string().optional(), item: ItemSchema.optional() });
export const SearchResponseSchema = z.object({ q: z.string(), items: z.array(SearchItemSchema) });

