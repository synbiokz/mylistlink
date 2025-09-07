import prisma from "@/lib/prisma";

export async function searchAll(q: string, limit = 5) {
  const query = q.trim();
  if (!query) return { items: [], lists: [] };

  const [items, lists] = await Promise.all([
    prisma.item.findMany({ where: { title: { contains: query } }, take: limit }),
    prisma.list.findMany({ where: { title: { contains: query }, status: "PUBLISHED" }, take: limit }),
  ]);

  return { items, lists };
}

