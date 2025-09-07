import prisma from "@/lib/prisma";
import { slugify } from "@/data/util";

export async function createDraft(ownerId: number, title: string, description?: string | null) {
  const slug = await uniqueListSlug(slugify(title).slice(0, 60));
  return prisma.list.create({ data: { ownerId, title, description: description ?? null, slug, status: "DRAFT" } });
}

export async function updateDraft(listId: number, data: { title?: string; description?: string | null }) {
  return prisma.list.update({ where: { id: listId }, data });
}

export async function addOrUpdateItem(listId: number, itemId: number, position: number) {
  if (position < 1 || position > 7) throw new Error("Position must be 1..7");
  return prisma.listItem.upsert({
    where: { listId_itemId: { listId, itemId } },
    update: { position },
    create: { listId, itemId, position },
  });
}

export async function publishList(listId: number) {
  const count = await prisma.listItem.count({ where: { listId } });
  if (count !== 7) throw new Error("List must have exactly 7 items to publish");
  return prisma.list.update({ where: { id: listId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
}

export async function getBySlug(slug: string) {
  return prisma.list.findUnique({
    where: { slug },
    include: { items: { include: { item: true }, orderBy: { position: "asc" } }, owner: true },
  });
}

export async function listRecentPublished(limit = 12) {
  return prisma.list.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: limit });
}

export async function listByUser(userId: number, limit = 12) {
  return prisma.list.findMany({ where: { ownerId: userId, status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: limit });
}

async function uniqueListSlug(base: string) {
  let slug = base || "list";
  let i = 1;
  while (await prisma.list.findUnique({ where: { slug } })) slug = `${base}-${i++}`;
  return slug;
}

