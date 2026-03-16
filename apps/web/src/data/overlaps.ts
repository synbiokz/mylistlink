import prisma from "@/lib/prisma";

export type OverlapRow = {
  otherListId: number;
  sharedCount: number;
  similarity: number;
};

export async function computeSimilarLists(listId: number, limit = 10): Promise<OverlapRow[]> {
  const sourceBooks = await prisma.listItem.findMany({
    where: { listId },
    select: { bookId: true },
  });
  const bookIds = sourceBooks.map((item) => item.bookId);
  if (bookIds.length === 0) return [];

  const matches = await prisma.listItem.groupBy({
    by: ["listId"],
    where: {
      bookId: { in: bookIds },
      listId: { not: listId },
      list: { status: "PUBLISHED" },
    },
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: limit * 4,
  });
  if (matches.length === 0) return [];

  const counts = await prisma.listItem.groupBy({
    by: ["listId"],
    where: { listId: { in: matches.map((row) => row.listId) } },
    _count: { bookId: true },
  });
  const countsByList = new Map(counts.map((row) => [row.listId, row._count.bookId]));

  return matches
    .map((row) => {
      const sharedCount = row._count.bookId;
      const otherCount = countsByList.get(row.listId) ?? 0;
      const union = 7 + otherCount - sharedCount;
      return {
        otherListId: row.listId,
        sharedCount,
        similarity: union > 0 ? sharedCount / union : 0,
      };
    })
    .sort((left, right) => right.sharedCount - left.sharedCount || right.similarity - left.similarity)
    .slice(0, limit);
}

export async function overlapsForList(listId: number, limit = 10) {
  const rows = await computeSimilarLists(listId, limit);
  if (rows.length === 0) return [];

  const listIds = rows.map((row) => row.otherListId);
  const lists = await prisma.list.findMany({
    where: { id: { in: listIds } },
    include: {
      owner: {
        select: { handle: true, name: true, avatarUrl: true },
      },
    },
  });
  const byId = new Map(lists.map((list) => [list.id, list]));

  return rows
    .map((row) => {
      const list = byId.get(row.otherListId);
      if (!list) return null;
      return {
        list,
        overlap: row.sharedCount,
        similarity: row.similarity,
      };
    })
    .filter((row): row is NonNullable<typeof row> => !!row);
}

export async function hotOverlaps(sample = 20, take = 6) {
  const recent = await prisma.list.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: sample,
    include: {
      owner: {
        select: { handle: true, name: true, avatarUrl: true },
      },
    },
  });

  const matches = await Promise.all(
    recent.map(async (list) => {
      const best = (await overlapsForList(list.id, 1))[0];
      if (!best) return null;
      return {
        a: list,
        b: best.list,
        overlap: best.overlap,
        similarity: best.similarity,
      };
    })
  );

  return matches
    .filter((row): row is NonNullable<typeof row> => !!row)
    .sort((left, right) => right.overlap - left.overlap || right.similarity - left.similarity)
    .slice(0, take);
}
