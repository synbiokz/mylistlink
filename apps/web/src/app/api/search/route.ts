import { NextResponse } from "next/server";
import { searchAll } from "@/data/search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const data = await searchAll(q, 5);
  return NextResponse.json({ q, ...data });
}

