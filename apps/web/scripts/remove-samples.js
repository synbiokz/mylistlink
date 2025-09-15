/*
  Remove sample data by seedBatch (and safely handle dependencies).
  Usage: node apps/web/scripts/remove-samples.js <batch>
  Examples: node apps/web/scripts/remove-samples.js 5  -> removes 'samples-batch-5'
            node apps/web/scripts/remove-samples.js samples-batch-5
*/

const { PrismaClient } = require("@prisma/client");
const path = require("path");

function sqliteFallbackUrl() {
  const abs = path.resolve(process.cwd(), "apps/web/prisma/dev.db").replace(/\\/g, "/");
  return `file:${abs}`;
}

const resolvedUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0 ? process.env.DATABASE_URL : sqliteFallbackUrl();
const prisma = new PrismaClient({ datasources: { db: { url: resolvedUrl } } });

function normalizeBatch(arg) {
  if (!arg) throw new Error("batch required");
  if (/^\d+$/.test(arg)) return `samples-batch-${arg}`;
  return String(arg);
}

async function main() {
  const input = process.argv[2];
  const batch = normalizeBatch(input);
  const users = await prisma.user.findMany({ where: { isSample: true, seedBatch: batch }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) {
    console.log(JSON.stringify({ batch, removed: 0, note: "no users in batch" }));
    return;
  }

  // Gather lists owned by these users
  const lists = await prisma.list.findMany({ where: { ownerId: { in: userIds } }, select: { id: true } });
  const listIds = lists.map((l) => l.id);

  // Delete dependencies in safe order
  const results = {};

  results.listComments = await prisma.listComment.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, ...(listIds.length ? [{ listId: { in: listIds } }] : [])] },
  });
  results.listLikes = await prisma.listLike.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, ...(listIds.length ? [{ listId: { in: listIds } }] : [])] },
  });
  results.listSaves = await prisma.listSave.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, ...(listIds.length ? [{ listId: { in: listIds } }] : [])] },
  });
  results.follows = await prisma.follow.deleteMany({
    where: { OR: [{ followerId: { in: userIds } }, { followeeId: { in: userIds } }] },
  });
  if (listIds.length) {
    results.listItems = await prisma.listItem.deleteMany({ where: { listId: { in: listIds } } });
    results.lists = await prisma.list.deleteMany({ where: { id: { in: listIds } } });
  }

  // Finally delete users in the batch
  results.users = await prisma.user.deleteMany({ where: { id: { in: userIds }, isSample: true, seedBatch: batch } });

  console.log(JSON.stringify({ batch, users: userIds.length, results }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
