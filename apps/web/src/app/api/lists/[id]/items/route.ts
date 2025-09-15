import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addOrUpdateItem, getSlotsSnapshot, removeSlot, setSlotAtomic } from "@/data/lists";
import { resolveExternalItem } from "@/data/items";
import { upsertWorkFromExternal, mapItemToWork, upsertListWork } from "@/data/work";
import { requireSession } from "@/lib/auth";
import { getRequestId, withRequestId } from "@/lib/request";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const requestId = getRequestId(req);
  const session = await requireSession(req);
  if (!session) return withRequestId(NextResponse.json({ error: "unauthorized" }, { status: 401 }), requestId);
  const listId = Number(id);
  if (!listId || Number.isNaN(listId)) return withRequestId(NextResponse.json({ error: "invalid list id" }, { status: 400 }), requestId);
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) return withRequestId(NextResponse.json({ error: "not found" }, { status: 404 }), requestId);
  if (list.ownerId !== session.user.id) return withRequestId(NextResponse.json({ error: "forbidden" }, { status: 403 }), requestId);
  const body = await req.json().catch(() => null);
  if (!body || typeof body.position !== "number") {
    return withRequestId(NextResponse.json({ error: "position is required" }, { status: 400 }), requestId);
  }

  let itemId: number | null = null;
  if (body.itemId) {
    itemId = Number(body.itemId);
  } else if (body.source && body.sourceId && body.title) {
    const item = await resolveExternalItem({
      source: body.source,
      sourceId: String(body.sourceId),
      title: String(body.title),
      type: body.type ?? undefined,
      imageUrl: body.imageUrl ?? null,
      summary: body.summary ?? null,
      url: body.url ?? null,
    });
    itemId = item.id;
    // Map to Work and ItemWork
    try {
      const work = await upsertWorkFromExternal({
        source: String(body.source),
        sourceId: String(body.sourceId),
        title: String(body.title),
        type: body.type ?? null,
        imageUrl: body.imageUrl ?? null,
        summary: body.summary ?? null,
        url: body.url ?? null,
      });
      if (work?.id) await mapItemToWork(item.id, work.id);
    } catch {}
  } else {
    return NextResponse.json({ error: "provide itemId or source+sourceId+title" }, { status: 400 });
  }

  // Use transactional setter to align semantics with new contract
  const { slots } = await setSlotAtomic(listId, itemId!, body.position);
  // Also upsert ListWork if mapping exists
  try {
    const map = await prisma.itemWork.findUnique({ where: { itemId: itemId! } });
    if (map?.workId) await upsertListWork(listId, map.workId);
  } catch {}
  // Keep legacy response field for compatibility, plus slots snapshot
  const link = await prisma.listItem.findUnique({ where: { listId_itemId: { listId, itemId: itemId! } } });
  return withRequestId(NextResponse.json({ link, slots }), requestId);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const requestId = getRequestId(req);
  const session = await requireSession(req);
  if (!session) return withRequestId(NextResponse.json({ error: "unauthorized" }, { status: 401 }), requestId);
  const listId = Number(id);
  if (!listId || Number.isNaN(listId)) return withRequestId(NextResponse.json({ error: "invalid list id" }, { status: 400 }), requestId);
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) return withRequestId(NextResponse.json({ error: "not found" }, { status: 404 }), requestId);
  if (list.ownerId !== session.user.id) return withRequestId(NextResponse.json({ error: "forbidden" }, { status: 403 }), requestId);
  const url = new URL(req.url);
  const pos = Number(url.searchParams.get("position"));
  if (!Number.isInteger(pos) || pos < 1 || pos > 7) {
    return withRequestId(NextResponse.json({ error: "invalid position" }, { status: 400 }), requestId);
  }
  const { slots } = await removeSlot(listId, pos);
  return withRequestId(NextResponse.json({ slots }), requestId);
}
