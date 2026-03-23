import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { trendingBooks } from "@/data/books";
import { listRecentPublished } from "@/data/lists";

type RecentList = Awaited<ReturnType<typeof listRecentPublished>>[number];
type HotBook = Awaited<ReturnType<typeof trendingBooks>>[number];

export async function GET() {
  const [recentLists, topUsers, hotBooks] = await Promise.all([
    listRecentPublished(6),
    prisma.user.findMany({
      take: 6,
      orderBy: { lists: { _count: "desc" } },
      select: { id: true, handle: true, name: true, avatarUrl: true },
    }),
    trendingBooks(6),
  ]);

  return NextResponse.json({
    recentLists: recentLists.map((list: RecentList) => ({ slug: list.slug, title: list.title })),
    topUsers,
    hotBooks: hotBooks.map((book: HotBook) => ({ slug: book.slug, title: book.title })),
  });
}
