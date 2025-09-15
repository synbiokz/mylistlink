import prisma from "@/lib/prisma";

export type ExternalInput = {
  source: string;
  sourceId: string;
  title: string;
  type?: string | null;
  imageUrl?: string | null;
  summary?: any | null;
  url?: string | null;
};

function inferKind(src: string, type?: string | null): "Book" | "Movie" | "TVSeries" | "Album" | "Track" | "Comic" | "Game" | "Other" {
  const s = src.toLowerCase();
  const t = (type || "").toLowerCase();
  if (s === "openlibrary") return "Book";
  if (s === "omdb") {
    if (t === "movie") return "Movie";
    if (t === "series") return "TVSeries";
    return "Other";
  }
  if (s === "wikidata") return "Other";
  return "Other";
}

function mapAuthority(src: string): string {
  const s = src.toLowerCase();
  if (s === "omdb") return "imdb"; // OMDb returns imdbIDs
  if (s === "openlibrary") return "openlibrary";
  if (s === "wikidata") return "wikidata";
  return s;
}

export async function upsertWorkFromExternal(input: ExternalInput) {
  const authority = mapAuthority(input.source);
  const extId = String(input.sourceId);
  // If we already know this authority/id pair, reuse its Work
  const existing = await prisma.externalId.findUnique({ where: { authority_extId: { authority, extId } }, include: { work: true } }).catch(() => null);
  if (existing?.work) return existing.work;

  const kind = inferKind(input.source, input.type);
  // Create a new Work and attach the external id
  const work = await prisma.work.create({
    data: {
      kind,
      title: input.title || "Untitled",
      meta: input.summary ? { create: { summary: input.summary } } : undefined,
      ids: { create: { authority, extId } },
    },
  });
  return work;
}

export async function mapItemToWork(itemId: number, workId: number) {
  await prisma.itemWork.upsert({
    where: { itemId },
    update: { workId },
    create: { itemId, workId },
  });
}

export async function upsertListWork(listId: number, workId: number) {
  await prisma.listWork.upsert({
    where: { listId_workId: { listId, workId } },
    update: {},
    create: { listId, workId },
  });
}
