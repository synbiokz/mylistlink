import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { publishList } from "@/data/lists";
import { requireSession } from "@/lib/auth";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: { code: "AUTH_UNAUTHORIZED" } }, { status: 401 });

  const listId = Number(id);
  if (!Number.isInteger(listId)) {
    return NextResponse.json({ error: { code: "INPUT_INVALID", message: "invalid list id" } }, { status: 400 });
  }

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  if (list.ownerId !== session.user.id) return NextResponse.json({ error: { code: "AUTH_FORBIDDEN" } }, { status: 403 });

  try {
    const published = await publishList(listId);
    return NextResponse.json({ list: { id: published.id, slug: published.slug } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "publish failed";
    return NextResponse.json({ error: { code: "INPUT_INVALID", message } }, { status: 400 });
  }
}
