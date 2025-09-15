import { NextResponse } from "next/server";
import { resolveExternalItem } from "@/data/items";
import { getRequestId, withRequestId } from "@/lib/request";
import { upsertWorkFromExternal, mapItemToWork } from "@/data/work";
import { rateLimit } from "@/lib/limits";

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const ip = (req.headers as any)?.get?.("x-forwarded-for") || "local";
  if (!rateLimit(`resolve:${ip}`, 60, 20)) {
    return withRequestId(NextResponse.json({ error: { code: "RATE_LIMIT" } }, { status: 429 }), requestId);
  }
  const body = await req.json().catch(() => null);
  if (!body || !body.source || !body.sourceId || !body.title) {
    return withRequestId(
      NextResponse.json({ error: { code: "INPUT_INVALID", message: "source, sourceId, title required" } }, { status: 400 }),
      requestId
    );
  }
  const item = await resolveExternalItem({
    source: body.source,
    sourceId: String(body.sourceId),
    title: String(body.title),
    type: body.type ?? undefined,
    imageUrl: body.imageUrl ?? null,
    summary: body.summary ?? null,
    url: body.url ?? null,
  });
  // Phase A dual-write: ensure a corresponding Work exists for this external input
  let workId: number | null = null;
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
    if (work?.id) workId = Number(work.id);
    if (item?.id && workId) await mapItemToWork(item.id, workId);
  } catch (e) {
    // best-effort; do not fail legacy flow
    console.warn("[dual-write] work upsert failed", e);
  }
  // Normalized shape alongside legacy { item }
  const payload = {
    item,
    itemId: item.id,
    slug: item.slug,
    title: item.title,
    type: body.type ?? null,
    image: body.imageUrl ?? null,
    source: String(body.source),
    sourceId: String(body.sourceId),
    url: item.url ?? null,
    workId,
  };
  return withRequestId(NextResponse.json(payload), requestId);
}
