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

export async function trendingItems(limit = 6): Promise<Array<{ id: number; slug: string; title: string | null; count: number }>> {
  // Items that appear most across published lists
  const items = await prisma.item.findMany({
    where: { listItems: { some: { list: { status: "PUBLISHED" } } } },
    orderBy: { listItems: { _count: "desc" } },
    take: limit,
    select: { id: true, slug: true, title: true, _count: { select: { listItems: true } } },
  });
  return items.map((i) => ({ id: i.id, slug: i.slug, title: i.title ?? null, count: i._count.listItems }));
}
