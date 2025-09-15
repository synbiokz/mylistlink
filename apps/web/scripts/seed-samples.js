/*
  Seed 50 sample users with clear markers for safe cleanup.
  Usage: node apps/web/scripts/seed-samples.js [batchName]
*/

const { PrismaClient } = require("@prisma/client");
const path = require("path");

function sqliteFallbackUrl() {
  const abs = path.resolve(process.cwd(), "apps/web/prisma/dev.db").replace(/\\/g, "/");
  return `file:${abs}`;
}

const resolvedUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0 ? process.env.DATABASE_URL : sqliteFallbackUrl();
const prisma = new PrismaClient({ datasources: { db: { url: resolvedUrl } } });

function batchName() {
  if (process.argv[2]) return String(process.argv[2]);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `samples-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function main() {
  const batch = batchName();
  let created = 0;
  let updated = 0;
  for (let i = 1; i <= 50; i++) {
    const n = String(i).padStart(3, "0");
    const email = `sample+${n}@example.com`;
    const handle = `sample-${n}`;
    const name = `Sample User ${i}`;
    const res = await prisma.user.upsert({
      where: { email },
      update: { name, handle, isSample: true, seedBatch: batch },
      create: { email, name, handle, isSample: true, seedBatch: batch },
    });
    if (res.createdAt && res.updatedAt && res.createdAt.getTime() !== res.updatedAt.getTime()) updated++; else created++;
  }
  console.log(JSON.stringify({ batch, created, updated }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
