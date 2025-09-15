/*
  Assign 50 sample users into 5 seed batches of 10 each.
  Batches: samples-batch-1 .. samples-batch-5
  Grouping is based on numeric suffix in handle/email (sample-001..050).
  Usage: node apps/web/scripts/assign-sample-batches.js
*/

const { PrismaClient } = require("@prisma/client");
const path = require("path");

function sqliteFallbackUrl() {
  const abs = path.resolve(process.cwd(), "apps/web/prisma/dev.db").replace(/\\/g, "/");
  return `file:${abs}`;
}

const resolvedUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0 ? process.env.DATABASE_URL : sqliteFallbackUrl();
const prisma = new PrismaClient({ datasources: { db: { url: resolvedUrl } } });

function parseIndex(u) {
  // Try handle: sample-001
  if (u.handle && /^sample-\d{3}$/.test(u.handle)) {
    return parseInt(u.handle.split("-")[1], 10);
  }
  // Try email: sample+001@example.com
  if (u.email && /^sample\+\d{3}@/i.test(u.email)) {
    const m = u.email.match(/^sample\+(\d{3})@/i);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

async function main() {
  const users = await prisma.user.findMany({
    where: { isSample: true },
    select: { id: true, email: true, handle: true, seedBatch: true },
  });
  let updated = 0;
  let skipped = 0;
  for (const u of users) {
    const idx = parseIndex(u);
    if (!idx || idx < 1 || idx > 5000) {
      skipped++;
      continue;
    }
    const group = Math.ceil(idx / 10); // 1..5 for 1..50
    const batch = `samples-batch-${group}`;
    if (u.seedBatch === batch) continue;
    await prisma.user.update({ where: { id: u.id }, data: { seedBatch: batch } });
    updated++;
  }
  const counts = await prisma.user.groupBy({ by: ["seedBatch"], where: { isSample: true }, _count: { _all: true } });
  console.log(JSON.stringify({ updated, skipped, batches: counts }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
