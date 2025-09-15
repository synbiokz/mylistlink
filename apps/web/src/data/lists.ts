import prisma from "@/lib/prisma";
import { slugify } from "@/data/util";

export type Slot = {
  position: number;
  itemId: number | null;
  title: string | null;
  slug: string | null;
  url: string | null;
};

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

/**
 * Transactional slot setter implementing move/replace semantics.
 * - If item already exists on the list at oldPos, move to position.
 * - If destination position is occupied by another item, remove that row first.
 * Always returns the 7-slot snapshot after mutation.
 */
export async function setSlotAtomic(listId: number, itemId: number, position: number) {
  if (!Number.isInteger(listId) || !Number.isInteger(itemId)) throw new Error("Invalid ids");
  if (position < 1 || position > 7) throw new Error("Position must be 1..7");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.listItem.findUnique({ where: { listId_itemId: { listId, itemId } } });
    const dest = await tx.listItem.findUnique({ where: { listId_position: { listId, position } } }).catch(() => null);

    // If dest is occupied by a different item, clear it first
    if (dest && (existing ? dest.itemId !== existing.itemId : true)) {
      await tx.listItem.delete({ where: { listId_itemId: { listId, itemId: dest.itemId } } });
    }

    if (existing) {
      if (existing.position !== position) {
        await tx.listItem.update({
          where: { listId_itemId: { listId, itemId } },
          data: { position },
        });
      }
    } else {
      await tx.listItem.create({ data: { listId, itemId, position } });
    }
  }).catch(async (err) => {
    // On any constraint race, surface a consistent error for the API to translate
    (err as any).code = (err as any).code || "CONFLICT_POSITION";
    throw err;
  });

  const slots = await getSlotsSnapshot(listId);
  return { slots };
}

export async function removeSlot(listId: number, position: number) {
  if (position < 1 || position > 7) throw new Error("Position must be 1..7");
  await prisma.listItem
    .delete({ where: { listId_position: { listId, position } } })
    .catch(() => null);
  const slots = await getSlotsSnapshot(listId);
  return { slots };
}

export async function getSlotsSnapshot(listId: number): Promise<Slot[]> {
  const links = await prisma.listItem.findMany({
    where: { listId },
    include: { item: true },
  });
  const map = new Map<number, { itemId: number; title: string | null; slug: string | null; url: string | null }>();
  for (const li of links) {
    map.set(li.position, {
      itemId: li.itemId,
      title: li.item?.title ?? null,
      slug: li.item?.slug ?? null,
      url: li.item?.url ?? null,
    });
  }
  const slots: Slot[] = [];
  for (let p = 1; p <= 7; p++) {
    const v = map.get(p);
    slots.push({ position: p, itemId: v?.itemId ?? null, title: v?.title ?? null, slug: v?.slug ?? null, url: v?.url ?? null });
  }
  return slots;
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
