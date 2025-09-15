import { NextResponse } from "next/server";
import { createDraft } from "@/data/lists";
import { requireSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || !body.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const list = await createDraft(Number(session.user.id), String(body.title), body.description ?? null);
  return NextResponse.json({ list });
}
