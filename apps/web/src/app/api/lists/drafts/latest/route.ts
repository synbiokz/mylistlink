import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getSlotsSnapshot } from "@/data/lists";

export async function GET(req: Request) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const draft = await prisma.list.findFirst({
    where: { ownerId: session.user.id, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    include: { items: { include: { item: true } } },
  });
  if (!draft) return NextResponse.json({ draft: null });

  const positions: Array<{ source: string; sourceId: string; title: string } | null> = Array(7).fill(null);
  for (const li of draft.items) {
    const idx = Math.max(1, Math.min(li.position, 7)) - 1;
    positions[idx] = {
      source: "internal",
      sourceId: String(li.itemId),
      title: li.item.title ?? "Untitled",
    };
  }

  const slots = await getSlotsSnapshot(draft.id);
  return NextResponse.json({
    draft: {
      id: draft.id,
      slug: draft.slug,
      title: draft.title,
      description: draft.description,
      positions, // legacy compatibility for current UI
      slots, // normalized snapshot for new clients
    },
  });
}
