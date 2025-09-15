import prisma from "@/lib/prisma";

export type OverlapRow = {
  otherListId: number;
  sharedCount: number;
  similarity: number;
};

export async function computeSimilarLists(listId: number, limit = 10): Promise<OverlapRow[]> {
  // Fetch item IDs in the source list
  const items = await prisma.listItem.findMany({ where: { listId }, select: { itemId: true } });
  const itemIds = items.map((i) => i.itemId);
  if (itemIds.length === 0) return [];

  // Find other lists sharing any of these items
  const others = await prisma.listItem.groupBy({
    by: ["listId"],
    where: { itemId: { in: itemIds }, listId: { not: listId }, list: { status: "PUBLISHED" } },
    _count: { itemId: true },
    orderBy: { _count: { itemId: "desc" } },
    take: limit * 2,
  });

  // Get counts for union size (always 7 for source list once published)
  const pairs: OverlapRow[] = [];
  for (const o of others) {
    const otherCount = await prisma.listItem.count({ where: { listId: o.listId } });
    const shared = o._count.itemId;
    const union = 7 + otherCount - shared;
    const similarity = union > 0 ? shared / union : 0;
    pairs.push({ otherListId: o.listId, sharedCount: shared, similarity });
  }
  return pairs.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

// Convenience helper used by the list page to fetch similar lists
// and return a shape with the target list object and overlap count.
export async function overlapsForList(listId: number, limit = 10): Promise<Array<{ list: any; overlap: number; similarity: number }>> {
  const rows = await computeSimilarLists(listId, limit);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.otherListId);
  const lists = await prisma.list.findMany({ where: { id: { in: ids } } });
  const byId = new Map(lists.map((l) => [l.id, l] as const));
  return rows
    .map((r) => ({ list: byId.get(r.otherListId), overlap: r.sharedCount, similarity: r.similarity }))
    .filter((x): x is { list: any; overlap: number; similarity: number } => !!x.list);
}

// Aggregate hot overlaps by sampling recent published lists and taking their best match.
export async function hotOverlaps(sample = 20, take = 6): Promise<Array<{ a: any; b: any; overlap: number; similarity: number }>> {
  const recent = await prisma.list.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: sample });
  const results: Array<{ a: any; b: any; overlap: number; similarity: number }> = [];
  for (const l of recent) {
    const sims = await computeSimilarLists(l.id, 3);
    if (sims.length === 0) continue;
    const best = sims[0];
    const other = await prisma.list.findUnique({ where: { id: best.otherListId } });
    if (other) results.push({ a: l, b: other, overlap: best.sharedCount, similarity: best.similarity });
  }
  results.sort((x, y) => y.overlap - x.overlap || y.similarity - x.similarity);
  return results.slice(0, take);
}
