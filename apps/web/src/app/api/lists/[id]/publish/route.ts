import { NextRequest, NextResponse } from "next/server";
import { publishList } from "@/data/lists";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = Number(idStr);
  if (!id || Number.isNaN(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const list = await prisma.list.findUnique({ where: { id } });
  if (!list) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (list.ownerId !== session.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const updated = await publishList(id);
    return NextResponse.json({ list: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "publish failed" }, { status: 400 });
  }
}
