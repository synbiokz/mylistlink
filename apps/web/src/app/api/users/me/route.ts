import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: { code: "AUTH_UNAUTHORIZED" } as const }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, name: true, handle: true, avatarUrl: true } });
  if (!user) return NextResponse.json({ error: { code: "NOT_FOUND" as const } }, { status: 404 });
  return NextResponse.json({ user });
}

