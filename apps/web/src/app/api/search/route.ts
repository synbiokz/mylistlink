import { NextResponse } from "next/server";
import { searchAll } from "@/data/search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  return NextResponse.json({ q, ...(await searchAll(q, 5)) });
}
