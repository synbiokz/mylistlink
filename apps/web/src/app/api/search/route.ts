import { NextResponse } from "next/server";
import { searchAll } from "@/data/search";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const data = await searchAll(q, 5);
  // Also include users (handle/name contains)
  const query = q.trim();
  const users = query
    ? await prisma.user.findMany({
        where: {
          OR: [
            { handle: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, handle: true, name: true, avatarUrl: true },
      })
    : [];
  return NextResponse.json({ q, ...data, users });
}
