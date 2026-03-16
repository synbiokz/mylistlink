import { NextResponse } from "next/server";
import { searchOpenLibrary } from "@/data/sources";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Number(searchParams.get("limit") || 8);
  if (q.length < 3) return NextResponse.json({ q, books: [] });

  const books = await searchOpenLibrary(q, limit);
  return NextResponse.json({ q, books });
}
