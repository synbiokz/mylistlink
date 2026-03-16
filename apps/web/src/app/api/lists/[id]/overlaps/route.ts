import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { overlapsForList } from "@/data/overlaps";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const listId = Number(id);
  if (!Number.isInteger(listId)) {
    return NextResponse.json({ error: { code: "INPUT_INVALID", message: "invalid id" } }, { status: 400 });
  }

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

  return NextResponse.json({ listId, overlaps: await overlapsForList(listId, 10) });
}
