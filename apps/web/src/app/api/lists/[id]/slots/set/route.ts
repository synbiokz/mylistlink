import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { idemGet, idemSet } from "@/lib/idempotency";
import { getSlotsSnapshot, setSlotAtomic } from "@/data/lists";
import { getRequestId, withRequestId } from "@/lib/request";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const requestId = getRequestId(req);
  const listId = Number(id);
  const body = await req.json().catch(() => ({}));
  const position = Number(body?.position);
  const bookId = Number(body?.bookId);
  const clientRequestId = typeof body?.clientRequestId === "string" ? body.clientRequestId : undefined;

  if (!Number.isInteger(listId) || !Number.isInteger(bookId) || !Number.isInteger(position)) {
    return withRequestId(
      NextResponse.json({ error: { code: "INPUT_INVALID", message: "listId, bookId, and position are required" } }, { status: 400 }),
      requestId
    );
  }

  const session = await requireSession(req);
  if (!session) {
    return withRequestId(NextResponse.json({ error: { code: "AUTH_UNAUTHORIZED" } }, { status: 401 }), requestId);
  }

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) {
    return withRequestId(NextResponse.json({ error: { code: "NOT_FOUND", message: "list not found" } }, { status: 404 }), requestId);
  }
  if (list.ownerId !== session.user.id) {
    return withRequestId(NextResponse.json({ error: { code: "AUTH_FORBIDDEN" } }, { status: 403 }), requestId);
  }

  const cached = idemGet(listId, clientRequestId);
  if (cached) return withRequestId(NextResponse.json(cached), requestId);

  try {
    const payload = await setSlotAtomic(listId, bookId, position);
    idemSet(listId, clientRequestId, payload);
    return withRequestId(NextResponse.json(payload), requestId);
  } catch {
    const fresh = await getSlotsSnapshot(listId);
    return withRequestId(
      NextResponse.json({ error: { code: "CONFLICT_POSITION", message: "Position changed. List refreshed." }, slots: fresh }, { status: 409 }),
      requestId
    );
  }
}
