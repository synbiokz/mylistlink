import prisma from "@/lib/prisma";
import { featuredListsForBook, getBookBySlug, trendingBooks } from "@/data/books";
import { listCommentsForList } from "@/data/comments";
import { getListBySlug, listByUser, listRecentPublished, listTrendingPublished } from "@/data/lists";
import { getReactionState } from "@/data/reactions";
import { overlapsForList, hotOverlaps } from "@/data/overlaps";
import { getUserByHandle } from "@/data/users";

export type PreviewChip = {
  label: string;
  href: string;
};

export type ListPreview = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  publishedAt: Date | null;
  likesCount: number;
  savesCount: number;
  owner: {
    handle: string;
    name: string | null;
    avatarUrl: string | null;
  };
  previewBooks: PreviewChip[];
};

type PreviewSource = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  publishedAt: Date | null;
  likesCount: number;
  savesCount: number;
  owner: {
    handle: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

async function decorateListPreviews(lists: PreviewSource[]): Promise<ListPreview[]> {
  const ids = lists.map((list) => list.id);
  const items = ids.length
    ? await prisma.listItem.findMany({
        where: { listId: { in: ids } },
        include: {
          book: {
            include: { author: true },
          },
        },
        orderBy: [{ listId: "asc" }, { position: "asc" }],
      })
    : [];

  const byList = new Map<number, typeof items>();
  for (const item of items) {
    const current = byList.get(item.listId) ?? [];
    current.push(item);
    byList.set(item.listId, current);
  }

  return lists.map((list) => ({
    id: list.id,
    slug: list.slug,
    title: list.title,
    description: list.description,
    publishedAt: list.publishedAt,
    likesCount: list.likesCount,
    savesCount: list.savesCount,
    owner: list.owner,
    previewBooks: (byList.get(list.id) ?? []).slice(0, 3).map((item) => ({
      label: item.book.canonicalTitle,
      href: `/book/${item.book.slug}`,
    })),
  }));
}

export async function getSiteStats() {
  const [lists, users, books] = await Promise.all([
    prisma.list.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.book.count(),
  ]);

  return { lists, users, books };
}

export async function getNewestListPreviews(limit = 6) {
  return decorateListPreviews(await listRecentPublished(limit));
}

export async function getTrendingListPreviews(limit = 6) {
  return decorateListPreviews(await listTrendingPublished(limit));
}

export async function getTrendingBookCards(limit = 6) {
  return trendingBooks(limit);
}

export async function getHotOverlapCards(limit = 4) {
  return hotOverlaps(18, limit);
}

export async function getStarterGenres(limit = 6) {
  const rows = await prisma.book.groupBy({
    by: ["genrePrimary"],
    where: { genrePrimary: { not: null } },
    _count: { genrePrimary: true },
    orderBy: { _count: { genrePrimary: "desc" } },
    take: limit,
  });

  return rows
    .filter((row) => row.genrePrimary)
    .map((row) => ({
      genre: row.genrePrimary as string,
      count: row._count.genrePrimary,
    }));
}

export async function getTopCurators(limit = 4) {
  return prisma.user.findMany({
    take: limit,
    orderBy: { lists: { _count: "desc" } },
    select: {
      id: true,
      handle: true,
      name: true,
      avatarUrl: true,
      bio: true,
      _count: {
        select: {
          lists: true,
        },
      },
    },
  });
}

export async function getListPageData(slug: string, viewerId?: number | null) {
  const list = await getListBySlug(slug);
  if (!list) return null;

  const [overlaps, reactions] = await Promise.all([
    overlapsForList(list.id, 6),
    getReactionState(list.id, viewerId ?? null),
  ]);
  const comments = await listCommentsForList(list.id);

  const sharedBooksByList = new Map<number, string[]>();
  if (overlaps.length > 0) {
    const shared = await prisma.listItem.findMany({
      where: {
        listId: { in: overlaps.map((row) => row.list.id) },
        bookId: { in: list.items.map((item) => item.bookId) },
      },
      include: {
        book: true,
      },
      orderBy: { position: "asc" },
    });

    for (const row of shared) {
      const current = sharedBooksByList.get(row.listId) ?? [];
      if (!current.includes(row.book.canonicalTitle)) current.push(row.book.canonicalTitle);
      sharedBooksByList.set(row.listId, current);
    }
  }

  const trails = overlaps.map((row) => ({
    href: `/list/${row.list.slug}`,
    label: row.list.title,
    count: row.overlap,
    sharedBooks: sharedBooksByList.get(row.list.id) ?? [],
  }));

  return {
    list,
    overlaps,
    reactions,
    trails,
    comments: comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author,
    })),
  };
}

export async function getBookPageData(slug: string) {
  const book = await getBookBySlug(slug);
  if (!book) return null;

  const lists = await featuredListsForBook(book.id, 12);
  const listCount = await prisma.listItem.count({
    where: {
      bookId: book.id,
      list: { status: "PUBLISHED" },
    },
  });
  const recentLists = await decorateListPreviews(
    lists.map((list) => ({
      id: list.id,
      slug: list.slug,
      title: list.title,
      description: list.description,
      publishedAt: list.publishedAt,
      likesCount: list.likesCount,
      savesCount: list.savesCount,
      owner: {
        handle: list.owner.handle,
        name: list.owner.name,
        avatarUrl: list.owner.avatarUrl,
      },
    }))
  );

  return {
    book,
    listCount,
    lists: recentLists,
  };
}

export async function getUserPageData(handle: string) {
  const user = await getUserByHandle(handle);
  if (!user) return null;

  const previews = await decorateListPreviews(await listByUser(user.id, 24));
  const signatureBooks = await prisma.listItem.groupBy({
    by: ["bookId"],
    where: {
      list: {
        ownerId: user.id,
        status: "PUBLISHED",
      },
    },
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: 5,
  });

  const books = signatureBooks.length
    ? await prisma.book.findMany({
        where: { id: { in: signatureBooks.map((row) => row.bookId) } },
        include: { author: true },
      })
    : [];
  const byId = new Map(books.map((book) => [book.id, book]));

  return {
    user,
    lists: previews,
    signatureBooks: signatureBooks
      .map((row) => {
        const book = byId.get(row.bookId);
        if (!book) return null;
        return {
          id: book.id,
          slug: book.slug,
          title: book.canonicalTitle,
          authorName: book.author.name,
          count: row._count.bookId,
        };
      })
      .filter((book): book is NonNullable<typeof book> => !!book),
  };
}
