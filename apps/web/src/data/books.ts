import prisma from "@/lib/prisma";
import { slugify } from "@/data/util";
import type { ExternalBook } from "@/data/sources";

async function uniqueAuthorSlug(base: string) {
  let slug = base || "author";
  let index = 1;
  while (await prisma.author.findUnique({ where: { slug } })) {
    slug = `${base}-${index++}`;
  }
  return slug;
}

async function uniqueBookSlug(base: string) {
  let slug = base || "book";
  let index = 1;
  while (await prisma.book.findUnique({ where: { slug } })) {
    slug = `${base}-${index++}`;
  }
  return slug;
}

async function getOrCreateAuthor(name?: string | null) {
  const authorName = (name || "Unknown Author").trim() || "Unknown Author";
  const existing = await prisma.author.findUnique({ where: { name: authorName } });
  if (existing) return existing;

  const slug = await uniqueAuthorSlug(slugify(authorName).slice(0, 60));
  return prisma.author.create({
    data: {
      name: authorName,
      slug,
    },
  });
}

export async function resolveExternalBook(input: ExternalBook) {
  const existing = await prisma.book.findUnique({
    where: { openLibraryWorkId: input.sourceId },
    include: { author: true },
  });

  if (existing) {
    const nextAuthor = input.authorName && input.authorName !== existing.author.name
      ? await getOrCreateAuthor(input.authorName)
      : existing.author;
    return prisma.book.update({
      where: { id: existing.id },
      data: {
        authorId: nextAuthor.id,
        coverUrl: existing.coverUrl ?? input.coverUrl ?? null,
        publicationYear: existing.publicationYear ?? input.publicationYear ?? null,
        genrePrimary: existing.genrePrimary ?? input.genrePrimary ?? null,
      },
      include: { author: true },
    });
  }

  const author = await getOrCreateAuthor(input.authorName);
  const slug = await uniqueBookSlug(slugify(input.title).slice(0, 70));

  return prisma.book.create({
    data: {
      canonicalTitle: input.title,
      slug,
      authorId: author.id,
      coverUrl: input.coverUrl ?? null,
      publicationYear: input.publicationYear ?? null,
      genrePrimary: input.genrePrimary ?? null,
      openLibraryWorkId: input.sourceId,
    },
    include: { author: true },
  });
}

export async function getBookBySlug(slug: string) {
  return prisma.book.findUnique({
    where: { slug },
    include: { author: true },
  });
}

export async function featuredListsForBook(bookId: number, limit = 12) {
  const links = await prisma.listItem.findMany({
    where: {
      bookId,
      list: { status: "PUBLISHED" },
    },
    include: {
      list: {
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
      },
    },
    orderBy: { list: { publishedAt: "desc" } },
    take: limit,
  });

  return links.map((link) => link.list);
}

export async function trendingBooks(limit = 6) {
  const top = await prisma.listItem.groupBy({
    by: ["bookId"],
    where: { list: { status: "PUBLISHED" } },
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: limit,
  });

  const ids = top.map((row) => row.bookId);
  if (ids.length === 0) return [];

  const books = await prisma.book.findMany({
    where: { id: { in: ids } },
    include: { author: true },
  });
  const byId = new Map(books.map((book) => [book.id, book]));

  return top
    .map((row) => {
      const book = byId.get(row.bookId);
      if (!book) return null;
      return {
        id: book.id,
        slug: book.slug,
        title: book.canonicalTitle,
        authorName: book.author.name,
        coverUrl: book.coverUrl,
        publicationYear: book.publicationYear,
        genrePrimary: book.genrePrimary,
        count: row._count.bookId,
      };
    })
    .filter((book): book is NonNullable<typeof book> => !!book);
}
