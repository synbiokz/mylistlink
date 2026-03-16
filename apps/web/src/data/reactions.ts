import prisma from "@/lib/prisma";

export type ReactionKind = "like" | "save";

export async function getReactionState(listId: number, userId?: number | null) {
  const [list, liked, saved] = await Promise.all([
    prisma.list.findUnique({
      where: { id: listId },
      select: { id: true, likesCount: true, savesCount: true },
    }),
    userId ? prisma.listLike.findUnique({ where: { userId_listId: { userId, listId } } }) : null,
    userId ? prisma.listSave.findUnique({ where: { userId_listId: { userId, listId } } }) : null,
  ]);

  if (!list) return null;

  return {
    likesCount: list.likesCount,
    savesCount: list.savesCount,
    liked: !!liked,
    saved: !!saved,
  };
}

export async function toggleReaction(listId: number, userId: number, kind: ReactionKind) {
  return prisma.$transaction(async (tx) => {
    if (kind === "like") {
      const existing = await tx.listLike.findUnique({ where: { userId_listId: { userId, listId } } });
      if (existing) {
        await tx.listLike.delete({ where: { userId_listId: { userId, listId } } });
        await tx.list.update({ where: { id: listId }, data: { likesCount: { decrement: 1 } } });
      } else {
        await tx.listLike.create({ data: { userId, listId } });
        await tx.list.update({ where: { id: listId }, data: { likesCount: { increment: 1 } } });
      }
    } else {
      const existing = await tx.listSave.findUnique({ where: { userId_listId: { userId, listId } } });
      if (existing) {
        await tx.listSave.delete({ where: { userId_listId: { userId, listId } } });
        await tx.list.update({ where: { id: listId }, data: { savesCount: { decrement: 1 } } });
      } else {
        await tx.listSave.create({ data: { userId, listId } });
        await tx.list.update({ where: { id: listId }, data: { savesCount: { increment: 1 } } });
      }
    }

    const list = await tx.list.findUnique({
      where: { id: listId },
      select: { likesCount: true, savesCount: true },
    });
    if (!list) throw new Error("List not found");

    const [liked, saved] = await Promise.all([
      tx.listLike.findUnique({ where: { userId_listId: { userId, listId } } }),
      tx.listSave.findUnique({ where: { userId_listId: { userId, listId } } }),
    ]);

    return {
      likesCount: Math.max(0, list.likesCount),
      savesCount: Math.max(0, list.savesCount),
      liked: !!liked,
      saved: !!saved,
    };
  });
}
