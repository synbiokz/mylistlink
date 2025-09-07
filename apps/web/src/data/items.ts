import prisma from "@/lib/prisma";
import { normalizeKey, slugify } from "@/data/util";

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

