import prisma from "@/lib/prisma";

export async function getUserByHandle(handle: string) {
  return prisma.user.findUnique({ where: { handle } });
}

export async function follow(followerId: number, followeeId: number) {
  if (followerId === followeeId) return null;
  return prisma.follow.upsert({
    where: { followerId_followeeId: { followerId, followeeId } },
    update: {},
    create: { followerId, followeeId },
  });
}

export async function unfollow(followerId: number, followeeId: number) {
  return prisma.follow.delete({ where: { followerId_followeeId: { followerId, followeeId } } });
}

