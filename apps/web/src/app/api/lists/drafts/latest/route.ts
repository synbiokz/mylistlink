import { NextResponse } from "next/server";
import { getLatestDraftByOwner, getSlotsSnapshot } from "@/data/lists";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: { code: "AUTH_UNAUTHORIZED" } }, { status: 401 });

  const draft = await getLatestDraftByOwner(session.user.id);
  if (!draft) return NextResponse.json({ draft: null });

  const slots = await getSlotsSnapshot(draft.id);
  return NextResponse.json({
    draft: {
      id: draft.id,
      slug: draft.slug,
      title: draft.title,
      description: draft.description,
      slots,
    },
  });
}
