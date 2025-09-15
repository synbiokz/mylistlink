import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { idemGet, idemSet } from "@/lib/idempotency";
import { getSlotsSnapshot, setSlotAtomic } from "@/data/lists";
import { upsertListWork } from "@/data/work";
import { getRequestId, withRequestId } from "@/lib/request";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const t0 = Date.now();
  const requestId = getRequestId(req);
  const listId = Number(id);
  const body = await req.json().catch(() => ({}));
  const position = Number(body?.position);
  const itemId = Number(body?.itemId);
  const clientRequestId = typeof body?.clientRequestId === "string" ? body.clientRequestId : undefined;

  if (!Number.isInteger(listId) || !Number.isInteger(itemId) || !Number.isInteger(position)) {
    const resp = NextResponse.json({ error: { code: "INPUT_INVALID", message: "listId, itemId, position required" } }, { status: 400 });
    return withRequestId(resp, requestId);
  }

  const session = await requireSession(req);
  if (!session) {
    const resp = NextResponse.json({ error: { code: "AUTH_UNAUTHORIZED", message: "sign in required" } }, { status: 401 });
    return withRequestId(resp, requestId);
  }

  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) {
    const resp = NextResponse.json({ error: { code: "INPUT_INVALID", message: "list not found" } }, { status: 404 });
    return withRequestId(resp, requestId);
  }
  if (list.ownerId !== session.user.id) {
    const resp = NextResponse.json({ error: { code: "AUTH_FORBIDDEN", message: "not your list" } }, { status: 403 });
    return withRequestId(resp, requestId);
  }

  const idem = idemGet(listId, clientRequestId);
  if (idem) {
    const resp = NextResponse.json(idem, { status: 200 });
    return withRequestId(resp, requestId);
  }

  try {
    const { slots } = await setSlotAtomic(listId, itemId, position);
    // Dual-write: attach Work link if mapping exists
    const map = await prisma.itemWork.findUnique({ where: { itemId } }).catch(() => null);
    if (map?.workId) await upsertListWork(listId, map.workId);
    const payload = { slots };
    idemSet(listId, clientRequestId, payload);
    const resp = NextResponse.json(payload, { status: 200 });
    return withRequestId(resp, requestId);
  } catch (e: any) {
    const fresh = await getSlotsSnapshot(listId);
    const resp = NextResponse.json(
      { error: { code: "CONFLICT_POSITION", message: "Position changed, refreshed." }, slots: fresh },
      { status: 409 }
    );
    return withRequestId(resp, requestId);
  } finally {
    console.log(
      JSON.stringify({ route: "POST /api/lists/[id]/items/set", listId, position, itemId, durationMs: Date.now() - t0, requestId })
    );
  }
}
