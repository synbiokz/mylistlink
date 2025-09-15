/*
  Remove sample lists and safely cleanup sample items that are no longer referenced.
  Usage: node apps/web/scripts/remove-sample-lists.js <listsSeedBatch>
  Example: node apps/web/scripts/remove-sample-lists.js samples-data-2025-09-12
*/

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const batch = process.argv[2];
  if (!batch) throw new Error("listsSeedBatch required");

  const lists = await prisma.list.findMany({ where: { isSample: true, seedBatch: batch }, select: { id: true } });
  const listIds = lists.map((l) => l.id);
  if (listIds.length === 0) {
    console.log(JSON.stringify({ batch, removed: 0, note: "no lists in batch" }));
    return;
  }

  const results = {};

  results.listVibes = await prisma.listVibe.deleteMany({ where: { listId: { in: listIds } } });
  results.lineage = await prisma.listLineage.deleteMany({ where: { listId: { in: listIds } } });
  results.listItems = await prisma.listItem.deleteMany({ where: { listId: { in: listIds } } });
  results.lists = await prisma.list.deleteMany({ where: { id: { in: listIds } } });

  // Cleanup orphan sample items from this batch only
  const sampleItems = await prisma.item.findMany({ where: { isSample: true, seedBatch: batch }, select: { id: true } });
  let itemsRemoved = 0;
  for (const it of sampleItems) {
    const refs = await prisma.listItem.count({ where: { itemId: it.id } });
    if (refs === 0) {
      await prisma.item.delete({ where: { id: it.id } });
      itemsRemoved++;
    }
  }
  results.itemsRemoved = itemsRemoved;

  console.log(JSON.stringify({ batch, results }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });

