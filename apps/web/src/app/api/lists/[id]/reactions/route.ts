import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getReactionState, toggleReaction, type ReactionKind } from "@/data/reactions";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const listId = Number(id);
  if (!Number.isInteger(listId)) return NextResponse.json({ error: { code: "INPUT_INVALID" } }, { status: 400 });

  const session = await requireSession(req);
  const state = await getReactionState(listId, session?.user.id ?? null);
  if (!state) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json(state);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const listId = Number(id);
  if (!Number.isInteger(listId)) return NextResponse.json({ error: { code: "INPUT_INVALID" } }, { status: 400 });

  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: { code: "AUTH_UNAUTHORIZED" } }, { status: 401 });

  const list = await prisma.list.findUnique({ where: { id: listId }, select: { id: true } });
  if (!list) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  if (body?.kind !== "like" && body?.kind !== "save") {
    return NextResponse.json({ error: { code: "INPUT_INVALID", message: "invalid reaction kind" } }, { status: 400 });
  }

  return NextResponse.json(await toggleReaction(listId, session.user.id, body.kind as ReactionKind));
}
