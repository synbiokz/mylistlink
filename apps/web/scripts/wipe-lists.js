/*
  Wipe all lists and their dependent rows (dev/supabase).
  Safe order: comments, likes, saves, list-vibes, lineages, list-items, list-work, lists.
*/
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const out = {};
  out.comments = await prisma.listComment.deleteMany({});
  out.likes    = await prisma.listLike.deleteMany({});
  out.saves    = await prisma.listSave.deleteMany({});
  out.listVibes= await prisma.listVibe.deleteMany({});
  out.lineage  = await prisma.listLineage.deleteMany({});
  // New work link table (if present in client)
  try { out.listWork = await prisma.listWork.deleteMany({}); } catch { out.listWork = { count: 0, note: 'listWork not present in client' }; }
  out.listItems= await prisma.listItem.deleteMany({});
  out.lists    = await prisma.list.deleteMany({});

  // Sanity summary
  const remain = {
    lists: await prisma.list.count(),
    listItems: await prisma.listItem.count(),
  };
  try { remain.listWork = await prisma.listWork.count(); } catch { remain.listWork = 0; }

  console.log(JSON.stringify({ out, remain }, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });