import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { trendingItems } from "@/data/items";

export async function GET() {
  const [recentLists, topUsers] = await Promise.all([
    prisma.list.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 6, select: { id: true, slug: true, title: true } }),
    prisma.user.findMany({
      take: 6,
      orderBy: { lists: { _count: "desc" } },
      select: { id: true, handle: true, name: true, avatarUrl: true },
    }),
  ]);
  const hot = await trendingItems(6);
  const hotItems = hot.map((h) => ({ id: h.id, slug: h.slug, title: h.title }));
  return NextResponse.json({ recentLists, topUsers, hotItems });
}
