import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { trendingBooks } from "@/data/books";
import { listRecentPublished } from "@/data/lists";

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
    recentLists: recentLists.map((list) => ({ slug: list.slug, title: list.title })),
    topUsers,
    hotBooks: hotBooks.map((book) => ({ slug: book.slug, title: book.title })),
  });
}
