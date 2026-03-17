import { NextRequest, NextResponse } from "next/server";
import { createComment } from "@/data/comments";
import { requireSession } from "@/lib/auth";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: { code: "AUTH_UNAUTHORIZED" } }, { status: 401 });

  const { id } = await ctx.params;
  const listId = Number(id);
  const body = await req.json().catch(() => null);
  if (!Number.isInteger(listId) || !body?.body) {
    return NextResponse.json({ error: { code: "INPUT_INVALID", message: "list id and body are required" } }, { status: 400 });
  }

  try {
    const comment = await createComment(listId, session.user.id, String(body.body));
    return NextResponse.json({
      comment: {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        author: comment.author,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INPUT_INVALID", message: error instanceof Error ? error.message : "Unable to create comment" } },
      { status: 400 }
    );
  }
}
