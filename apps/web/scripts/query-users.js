const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({
    select: { id: true, email: true, handle: true, isSample: true, seedBatch: true },
    orderBy: { id: "asc" },
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});

