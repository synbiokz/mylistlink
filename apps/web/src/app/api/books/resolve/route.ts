import { NextResponse } from "next/server";
import { resolveExternalBook } from "@/data/books";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.sourceId || !body?.title) {
    return NextResponse.json({ error: { code: "INPUT_INVALID", message: "sourceId and title are required" } }, { status: 400 });
  }

  const book = await resolveExternalBook({
    source: "openlibrary",
    sourceId: String(body.sourceId),
    title: String(body.title),
    authorName: body.authorName ?? null,
    coverUrl: body.coverUrl ?? null,
    publicationYear: body.publicationYear ?? null,
    genrePrimary: body.genrePrimary ?? null,
    url: body.url ?? null,
  });

  return NextResponse.json({
    bookId: book.id,
    slug: book.slug,
    book: {
      id: book.id,
      slug: book.slug,
      canonicalTitle: book.canonicalTitle,
      authorName: book.author.name,
      coverUrl: book.coverUrl,
    },
  });
}
