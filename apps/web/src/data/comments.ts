import prisma from "@/lib/prisma";

export async function listCommentsForList(listId: number) {
  return prisma.listComment.findMany({
    where: {
      listId,
      list: { status: "PUBLISHED" },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: {
        select: {
          handle: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export async function createComment(listId: number, authorId: number, body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");
  if (trimmed.length > 1000) throw new Error("Comment must be 1000 characters or fewer");

  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      status: "PUBLISHED",
    },
    select: { id: true },
  });

  if (!list) throw new Error("List not found");

  return prisma.listComment.create({
    data: {
      listId,
      authorId,
      body: trimmed,
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: {
        select: {
          handle: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });
}
