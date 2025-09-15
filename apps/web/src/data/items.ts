import prisma from "@/lib/prisma";
import { normalizeKey, slugify } from "@/data/util";
import type { ExternalItem } from "@/data/sources";

// In-memory alias memo to reduce thundering herd on hot resolves (M1 scope)
const aliasMemo = new Map<string, { at: number; id: number }>();
const MEMO_TTL = 5 * 60 * 1000; // 5 minutes

export async function resolveOrCreateItem(input: { title?: string; url?: string | null }) {
  const base = input.url ?? input.title ?? "";
  const key = normalizeKey(base);
  const found = await prisma.item.findUnique({ where: { normalizedKey: key } });
  if (found) return found;
  const title = input.title ?? input.url ?? "Untitled";
  const slug = await uniqueItemSlug(slugify(title).slice(0, 50));
  return prisma.item.create({
    data: {
      title,
      url: input.url ?? null,
      normalizedKey: key,
      slug,
    },
  });
}

async function uniqueItemSlug(base: string) {
  let slug = base || "item";
  let i = 1;
  while (await prisma.item.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function getItemBySlug(slug: string) {
  return prisma.item.findUnique({ where: { slug } });
}

export async function listsForItem(itemId: number, limit = 12) {
  const links = await prisma.listItem.findMany({
    where: { itemId, list: { status: "PUBLISHED" } },
    include: { list: true },
    take: limit,
  });
  return links.map((li) => li.list);
}

export async function resolveExternalItem(ext: ExternalItem) {
  const aliasKey = externalAliasKey(ext.source, ext.sourceId);
  const now = Date.now();
  const memo = aliasMemo.get(aliasKey);
  if (memo && now - memo.at < MEMO_TTL) {
    const found = await prisma.item.findUnique({ where: { id: memo.id } }).catch(() => null);
    if (found) return found;
  }
  // Check alias table first
  const existingAlias = await prisma.itemAlias.findUnique({ where: { aliasKey } });
  if (existingAlias) {
    const found = await prisma.item.findUnique({ where: { id: existingAlias.itemId } });
    if (found) {
      aliasMemo.set(aliasKey, { at: now, id: found.id });
      return found;
    }
  }

  // Fallback: try normalizedKey against title or url
  const base = ext.url ?? ext.title;
  const norm = normalizeKey(base);
  const byNorm = await prisma.item.findUnique({ where: { normalizedKey: norm } }).catch(() => null);
  if (byNorm) {
    // Attach alias for future lookups
    await prisma.itemAlias.create({ data: { itemId: byNorm.id, aliasKey } }).catch(() => {});
    aliasMemo.set(aliasKey, { at: now, id: byNorm.id });
    return byNorm;
  }

  // Create new item and alias
  const slug = await uniqueItemSlug(slugify(ext.title).slice(0, 50));
  const created = await prisma.item.create({
    data: {
      title: ext.title,
      url: ext.url ?? null,
      normalizedKey: norm,
      slug,
    },
  });
  await prisma.itemAlias.create({ data: { itemId: created.id, aliasKey } }).catch(() => {});
  aliasMemo.set(aliasKey, { at: now, id: created.id });
  return created;
}

function externalAliasKey(source: string, id: string) {
  return `${source}:${id}`;
}

// Simple cache for trending
type TrendCacheEntry = { at: number; items: Array<{ id: number; slug: string; title: string | null; count: number }> };
const TREND_CACHE = new Map<string, TrendCacheEntry>();
const TREND_TTL_MS = 30_000;

export async function trendingItems(limit = 6): Promise<Array<{ id: number; slug: string; title: string | null; count: number }>> {
  const key = String(limit);
  const now = Date.now();
  const hit = TREND_CACHE.get(key);
  if (hit && now - hit.at < TREND_TTL_MS) return hit.items;

  try {
    // Work-first: find top Works by ListWork appearances in published lists,
    // then pick a representative Item (via ItemWork) to provide a slug for navigation.
    const top = await prisma.listWork.groupBy({
      by: ["workId"],
      where: { list: { status: "PUBLISHED" } } as any,
      _count: { workId: true },
      orderBy: { _count: { workId: "desc" } },
      take: limit * 2,
    } as any);

    const workIds = top.map((t: any) => t.workId as number);
    if (workIds.length === 0) {
      TREND_CACHE.set(key, { at: now, items: [] });
      return [];
    }
    // Fetch representative Item per Work (first mapping wins)
    const maps = await prisma.itemWork.findMany({ where: { workId: { in: workIds } }, include: { item: true } } as any);
    const byWork = new Map<number, { slug: string; title: string | null }>();
    for (const m of maps) {
      if (!byWork.has((m as any).workId) && (m as any).item?.slug) {
        byWork.set((m as any).workId, { slug: (m as any).item.slug, title: (m as any).item.title ?? null });
      }
    }
    const out: Array<{ id: number; slug: string; title: string | null; count: number }> = [];
    for (const t of top) {
      const workId = (t as any).workId as number;
      const rep = byWork.get(workId);
      if (!rep) continue; // skip if no representative item to link to
      out.push({ id: workId, slug: rep.slug, title: rep.title ?? null, count: (t as any)._count.workId as number });
      if (out.length >= limit) break;
    }
    TREND_CACHE.set(key, { at: now, items: out });
    return out;
  } catch {
    // Legacy fallback: Item-based trending
    const items = await prisma.item.findMany({
      where: { listItems: { some: { list: { status: "PUBLISHED" } } } },
      orderBy: { listItems: { _count: "desc" } },
      take: limit,
      select: { id: true, slug: true, title: true, _count: { select: { listItems: true } } },
    });
    const out = items.map((i) => ({ id: i.id, slug: i.slug, title: i.title ?? null, count: i._count.listItems }));
    TREND_CACHE.set(key, { at: now, items: out });
    return out;
  }
}
