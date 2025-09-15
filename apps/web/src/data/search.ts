import prisma from "@/lib/prisma";

export async function searchAll(q: string, limit = 5) {
  const query = q.trim();
  if (!query) return { items: [], lists: [] };

  const [items, lists] = await Promise.all([
    prisma.item.findMany({ where: { title: { contains: query, mode: "insensitive" } }, take: limit }),
    prisma.list.findMany({ where: { title: { contains: query, mode: "insensitive" }, status: "PUBLISHED" }, take: limit, select: { id: true, slug: true, title: true } }),
  ]);

  return { items, lists };
}
