import prisma from "@/lib/prisma";

export async function searchAll(q: string, limit = 5) {
  const query = q.trim();
  if (!query) return { books: [], lists: [], users: [] };

  const [books, lists, users] = await Promise.all([
    prisma.book.findMany({
      where: { canonicalTitle: { contains: query, mode: "insensitive" } },
      take: limit,
      include: { author: true },
    }),
    prisma.list.findMany({
      where: {
        title: { contains: query, mode: "insensitive" },
        status: "PUBLISHED",
      },
      take: limit,
      select: { id: true, slug: true, title: true },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { handle: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: { id: true, handle: true, name: true, avatarUrl: true },
    }),
  ]);

  return { books, lists, users };
}
