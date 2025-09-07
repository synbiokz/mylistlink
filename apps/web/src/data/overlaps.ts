import prisma from "@/lib/prisma";

export async function overlapsForList(listId: number, limit = 6) {
  // SQLite-friendly raw SQL for overlap counts
  const rows: { otherListId: number; overlap: number }[] = await prisma.$queryRawUnsafe(
    `SELECT b.listId as otherListId, COUNT(*) as overlap
     FROM ListItem a
     JOIN ListItem b ON a.itemId = b.itemId
     WHERE a.listId = ? AND b.listId <> ?
     GROUP BY b.listId
     ORDER BY overlap DESC, b.listId
     LIMIT ?`,
    listId,
    listId,
    limit
  );
  const ids = rows.map((r) => r.otherListId);
  const lists = await prisma.list.findMany({ where: { id: { in: ids } } });
  const byId = new Map(lists.map((l) => [l.id, l] as const));
  return rows.map((r) => ({ list: byId.get(r.otherListId)!, overlap: r.overlap }));
}

