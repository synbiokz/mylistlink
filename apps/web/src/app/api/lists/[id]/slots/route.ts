import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { removeSlot } from "@/data/lists";
import { requireSession } from "@/lib/auth";
import { getRequestId, withRequestId } from "@/lib/request";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const requestId = getRequestId(req);
  const session = await requireSession(req);
  if (!session) return withRequestId(NextResponse.json({ error: { code: "AUTH_UNAUTHORIZED" } }, { status: 401 }), requestId);

  const listId = Number(id);
  const position = Number(new URL(req.url).searchParams.get("position"));
  if (!Number.isInteger(listId) || !Number.isInteger(position)) {
    return withRequestId(NextResponse.json({ error: { code: "INPUT_INVALID", message: "invalid list id or position" } }, { status: 400 }), requestId);
  }

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) return withRequestId(NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 }), requestId);
  if (list.ownerId !== session.user.id) return withRequestId(NextResponse.json({ error: { code: "AUTH_FORBIDDEN" } }, { status: 403 }), requestId);

  return withRequestId(NextResponse.json(await removeSlot(listId, position)), requestId);
}
