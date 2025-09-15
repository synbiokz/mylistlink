import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const [recentLists, topUsers, hotItems] = await Promise.all([
    prisma.list.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 6, select: { id: true, slug: true, title: true } }),
    prisma.user.findMany({
      take: 6,
      orderBy: { lists: { _count: "desc" } },
      select: { id: true, handle: true, name: true, avatarUrl: true },
    }),
    prisma.item.findMany({
      where: { listItems: { some: { list: { status: "PUBLISHED" } } } },
      orderBy: { listItems: { _count: "desc" } },
      take: 6,
      select: { id: true, slug: true, title: true },
    }),
  ]);
  return NextResponse.json({ recentLists, topUsers, hotItems });
}

