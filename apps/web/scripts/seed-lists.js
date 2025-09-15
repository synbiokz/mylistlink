/*
  Seed published sample lists with overlapping items, vibes, and simple lineage.
  - Uses existing sample users (isSample=true) filtered by batches (e.g., 1,2,3,4 => samples-batch-1..4)
  - Creates items (global + cluster), lists with 7 slots, list-vibes, and lineage edges.
  - Flags: List.isSample, List.seedBatch; Item.isSample, Item.seedBatch; Vibe may be seeded with flags as well.

  Usage:
    node apps/web/scripts/seed-lists.js --batches 1,2,3,4 --batch-name samples-data-YYYYMMDD --lists-per-user 2
*/

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { batches: [1, 2, 3, 4], batchName: `samples-data-${new Date().toISOString().slice(0,10)}`, listsPerUser: 2 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--batches" && args[i + 1]) out.batches = String(args[++i]).split(",").map((n) => Number(n.trim())).filter(Boolean);
    else if (a === "--batch-name" && args[i + 1]) out.batchName = String(args[++i]);
    else if (a === "--lists-per-user" && args[i + 1]) out.listsPerUser = Number(args[++i]) || 2;
  }
  return out;
}

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}
function normalizeKey(s) {
  return (s || "").trim().toLowerCase().replace(/https?:\/\//g, "").replace(/\s+/g, " ").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

// Deterministic PRNG (mulberry32)
function mulberry32(a) {
  return function() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GLOBAL_ITEMS = [
  "The Matrix",
  "The Hobbit",
  "Paris",
  "Espresso",
  "Python",
  "Rust",
  "Radiohead - OK Computer",
  "Miyazaki",
  "Moleskine Notebook",
  "Hiking Boots",
  "Dark Chocolate",
  "Ambient Chill Playlist"
];

const CLUSTERS = {
  sciFiMovies: [
    "Blade Runner 2049",
    "Arrival",
    "Ex Machina",
    "Her",
    "Annihilation",
    "Minority Report",
    "Children of Men",
    "Interstellar",
    "Moon",
    "District 9",
  ],
  fantasyBooks: [
    "The Name of the Wind",
    "Mistborn",
    "The Way of Kings",
    "The Lies of Locke Lamora",
    "A Wizard of Earthsea",
    "The Silmarillion",
    "The Blade Itself",
    "Jonathan Strange & Mr Norrell",
    "Good Omens",
    "The Broken Empire",
  ],
  coffeeDrinks: ["Cortado", "Flat White", "Americano", "Cappuccino", "Latte", "Mocha", "Macchiato", "Pour-over", "Cold Brew"],
  travelCities: ["Kyoto", "Reykjavik", "Lisbon", "Seoul", "New York", "Buenos Aires", "Barcelona", "Berlin", "Vancouver"],
  progLangs: ["Go", "TypeScript", "Elixir", "Clojure", "Haskell", "Kotlin", "Swift", "Zig", "Dart", "R"],
  classicAlbums: [
    "Pink Floyd - The Dark Side of the Moon",
    "The Beatles - Abbey Road",
    "Kendrick Lamar - To Pimp a Butterfly",
    "Nirvana - Nevermind",
    "Daft Punk - Discovery",
    "Fleetwood Mac - Rumours",
    "David Bowie - Low",
    "The Strokes - Is This It",
    "Radiohead - In Rainbows",
    "LCD Soundsystem - Sound of Silver",
  ],
};

const VIBES = ["Cozy", "Futuristic", "Adventurous", "Wholesome", "Cyberpunk", "Warm", "Urban", "Minimalist", "Outdoorsy"]; 

async function upsertVibe(label, batchName) {
  const slug = slugify(label);
  let v = await prisma.vibe.findUnique({ where: { slug } }).catch(() => null);
  if (!v) v = await prisma.vibe.create({ data: { slug, label, isSample: true, seedBatch: batchName } });
  return v;
}

async function upsertItem(title, batchName) {
  const norm = normalizeKey(title);
  let it = await prisma.item.findUnique({ where: { normalizedKey: norm } }).catch(() => null);
  if (it) return it;
  // Unique slug
  let base = slugify(title).slice(0, 50) || "item";
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.item.findUnique({ where: { slug } }).catch(() => null)) slug = `${base}-${i++}`;
  return prisma.item.create({ data: { title, url: null, normalizedKey: norm, slug, isSample: true, seedBatch: batchName } });
}

async function createListForUser(user, clusterName, rng, batchName) {
  const cluster = CLUSTERS[clusterName];
  if (!cluster) throw new Error(`unknown cluster ${clusterName}`);

  // Pick 4 cluster items
  const picks = new Set();
  while (picks.size < 4) picks.add(cluster[Math.floor(rng() * cluster.length)]);
  const clusterItems = Array.from(picks);
  // Pick 2 global items
  const gpicks = new Set();
  while (gpicks.size < 2) gpicks.add(GLOBAL_ITEMS[Math.floor(rng() * GLOBAL_ITEMS.length)]);
  const globalItems = Array.from(gpicks);
  // 1 unique filler
  const filler = `${clusterName} pick #${Math.floor(rng() * 9000) + 1000}`;

  const itemsTitles = [...clusterItems, ...globalItems, filler];
  const items = [];
  for (const t of itemsTitles) items.push(await upsertItem(t, batchName));

  // List title
  const title = `${clusterName.replace(/([A-Z])/g, ' $1').toLowerCase()} — picks by ${user.handle}`;
  const baseSlug = slugify(title).slice(0, 60) || `list-${user.id}`;
  let slug = baseSlug, i = 1;
  while (await prisma.list.findUnique({ where: { slug } })) slug = `${baseSlug}-${i++}`;

  const list = await prisma.list.create({
    data: {
      ownerId: user.id,
      title,
      description: null,
      visibility: "PUBLIC",
      status: "PUBLISHED",
      slug,
      publishedAt: new Date(),
      isSample: true,
      seedBatch: batchName,
    },
  });

  // Insert items into positions 1..7
  let pos = 1;
  for (const it of items) {
    await prisma.listItem.create({ data: { listId: list.id, itemId: it.id, position: pos++ } });
  }

  // Attach 1–2 vibes
  const vibCount = Math.random() < 0.6 ? 2 : 1; // a bit of variation
  const vibLabels = new Set();
  while (vibLabels.size < vibCount) vibLabels.add(VIBES[Math.floor(rng() * VIBES.length)]);
  for (const label of vibLabels) {
    const v = await upsertVibe(label, batchName);
    await prisma.listVibe.upsert({
      where: { listId_vibeId: { listId: list.id, vibeId: v.id } },
      create: { listId: list.id, vibeId: v.id, weight: 1, source: "user" },
      update: {},
    });
    // Light user-vibe touch
    await prisma.userVibe.upsert({
      where: { userId_vibeId: { userId: user.id, vibeId: v.id } },
      create: { userId: user.id, vibeId: v.id, count: 1, lastTouchedAt: new Date() },
      update: { count: { increment: 1 }, lastTouchedAt: new Date() },
    });
  }

  // Lineage: set spawned from one of the cluster items
  const parentItem = items[0];
  await prisma.listLineage.create({ data: { listId: list.id, spawnedFromItemId: parentItem.id } });

  return { listId: list.id };
}

async function main() {
  const { batches, batchName, listsPerUser } = parseArgs();
  const batchNames = batches.map((n) => `samples-batch-${n}`);
  const users = await prisma.user.findMany({ where: { isSample: true, seedBatch: { in: batchNames } }, select: { id: true, handle: true } });
  const clusters = Object.keys(CLUSTERS);
  let createdLists = 0;
  for (const u of users) {
    const seed = crypto.createHash("sha1").update(String(u.id)).digest().readUInt32BE(0);
    const rng = mulberry32(seed);
    for (let k = 0; k < listsPerUser; k++) {
      const cluster = clusters[(u.id + k) % clusters.length];
      await createListForUser(u, cluster, rng, batchName);
      createdLists++;
    }
  }
  const counts = {
    users: users.length,
    lists: createdLists,
    listItems: await prisma.listItem.count({ where: { list: { isSample: true, seedBatch: batchName } } }),
    items: await prisma.item.count({ where: { isSample: true, seedBatch: batchName } }),
  };
  console.log(JSON.stringify({ batchName, created: counts }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });

