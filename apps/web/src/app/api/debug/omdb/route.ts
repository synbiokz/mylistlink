import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "Interstellar";
  const key = process.env.OMDB_API_KEY || "";
  const url = `https://www.omdbapi.com/?apikey=${key}&s=${encodeURIComponent(q)}`;
  let ok = false;
  let status = 0;
  let data: any = null;
  let error: any = null;
  try {
    const res = await fetch(url);
    status = res.status;
    ok = res.ok;
    data = await res.json();
  } catch (e: any) {
    error = e?.message || String(e);
  }
  return NextResponse.json({
    hasKey: Boolean(key),
    q,
    status,
    ok,
    sampleTitle: data?.Search?.[0]?.Title || null,
    rawError: error,
    apiResponse: data?.Response ?? null,
    apiError: data?.Error ?? null,
  });
}

