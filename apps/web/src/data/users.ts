import prisma from "@/lib/prisma";

export async function getUserByHandle(handle: string) {
  return prisma.user.findUnique({ where: { handle } });
}
