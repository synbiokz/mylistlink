import prisma from "@/lib/prisma";
import { slugify } from "@/data/util";

export type Slot = {
  position: number;
  bookId: number | null;
  title: string | null;
  slug: string | null;
  authorName: string | null;
  coverUrl: string | null;
};

async function uniqueListSlug(base: string) {
  let slug = base || "list";
  let index = 1;
  while (await prisma.list.findUnique({ where: { slug } })) {
    slug = `${base}-${index++}`;
  }
  return slug;
}

export async function createDraft(ownerId: number, title: string, description?: string | null) {
  const slug = await uniqueListSlug(slugify(title).slice(0, 60));
  return prisma.list.create({
    data: {
      ownerId,
      title,
      description: description ?? null,
      status: "DRAFT",
      slug,
    },
  });
}

export async function getLatestDraftByOwner(ownerId: number) {
  return prisma.list.findFirst({
    where: { ownerId, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        include: {
          book: {
            include: { author: true },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });
}

export async function setSlotAtomic(listId: number, bookId: number, position: number) {
  if (!Number.isInteger(listId) || !Number.isInteger(bookId)) throw new Error("Invalid ids");
  if (position < 1 || position > 7) throw new Error("Position must be 1..7");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.listItem.findUnique({
      where: { listId_bookId: { listId, bookId } },
    });
    const destination = await tx.listItem.findUnique({
      where: { listId_position: { listId, position } },
    });

    if (destination && destination.bookId !== bookId) {
      await tx.listItem.delete({
        where: { listId_bookId: { listId, bookId: destination.bookId } },
      });
    }

    if (existing) {
      if (existing.position !== position) {
        await tx.listItem.update({
          where: { listId_bookId: { listId, bookId } },
          data: { position },
        });
      }
      return;
    }

    await tx.listItem.create({
      data: { listId, bookId, position },
    });
  });

  return { slots: await getSlotsSnapshot(listId) };
}

export async function removeSlot(listId: number, position: number) {
  if (position < 1 || position > 7) throw new Error("Position must be 1..7");
  await prisma.listItem.delete({ where: { listId_position: { listId, position } } }).catch(() => null);
  return { slots: await getSlotsSnapshot(listId) };
}

export async function getSlotsSnapshot(listId: number): Promise<Slot[]> {
  const links = await prisma.listItem.findMany({
    where: { listId },
    include: {
      book: {
        include: { author: true },
      },
    },
    orderBy: { position: "asc" },
  });

  const byPosition = new Map(
    links.map((link) => [
      link.position,
      {
        bookId: link.bookId,
        title: link.book.canonicalTitle,
        slug: link.book.slug,
        authorName: link.book.author.name,
        coverUrl: link.book.coverUrl,
      },
    ])
  );

  const slots: Slot[] = [];
  for (let position = 1; position <= 7; position += 1) {
    const slot = byPosition.get(position);
    slots.push({
      position,
      bookId: slot?.bookId ?? null,
      title: slot?.title ?? null,
      slug: slot?.slug ?? null,
      authorName: slot?.authorName ?? null,
      coverUrl: slot?.coverUrl ?? null,
    });
  }
  return slots;
}

export async function publishList(listId: number) {
  const count = await prisma.listItem.count({ where: { listId } });
  if (count !== 7) throw new Error("List must have exactly 7 books to publish");
  return prisma.list.update({
    where: { id: listId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
}

export async function getListBySlug(slug: string) {
  return prisma.list.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      owner: true,
      items: {
        include: {
          book: {
            include: { author: true },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });
}

export async function listRecentPublished(limit = 12) {
  return prisma.list.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      owner: {
        select: { handle: true, name: true, avatarUrl: true },
      },
    },
  });
}

export async function listTrendingPublished(limit = 12) {
  return prisma.list.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ likesCount: "desc" }, { savesCount: "desc" }, { publishedAt: "desc" }],
    take: limit,
    include: {
      owner: {
        select: { handle: true, name: true, avatarUrl: true },
      },
    },
  });
}

export async function listByUser(userId: number, limit = 12) {
  return prisma.list.findMany({
    where: { ownerId: userId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      owner: {
        select: { handle: true, name: true, avatarUrl: true },
      },
    },
  });
}
