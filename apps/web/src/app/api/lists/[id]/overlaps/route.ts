import { NextRequest, NextResponse } from "next/server";
import { computeSimilarLists } from "@/data/overlaps";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!id || Number.isNaN(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const list = await prisma.list.findUnique({ where: { id } });
  if (!list) return NextResponse.json({ error: "not found" }, { status: 404 });
  const rows = await computeSimilarLists(id, 10);
  const otherIds = rows.map((r) => r.otherListId);
  const others = await prisma.list.findMany({ where: { id: { in: otherIds } }, include: { owner: true } });
  return NextResponse.json({ listId: id, overlaps: rows, lists: others });
}
