Sample Data — Users, Lists, Items, Vibes, Lineage (Reference)

Users
- Seed 50 users (uses `DATABASE_URL` if set, else local SQLite): pnpm --filter web run seed:samples
- Assign into 5 batches: pnpm --filter web run seed:assign-batches
- Remove a batch of users: pnpm --filter web run seed:remove 5

Lists/Items/Vibes/Lineage
- Seed published lists for batches 1..4:
  - PowerShell:
    $env:DATABASE_URL='file:./apps/web/prisma/dev.db'; pnpm --filter web run seed:lists -- --batches 1,2,3,4 --batch-name samples-data-YYYYMMDD --lists-per-user 2
  - Bash:
    DATABASE_URL="file:./apps/web/prisma/dev.db" pnpm --filter web run seed:lists -- --batches 1,2,3,4 --batch-name samples-data-YYYYMMDD --lists-per-user 2
- Remove lists/items for a lists batch:
  DATABASE_URL="file:./apps/web/prisma/dev.db" pnpm --filter web run seed:remove-lists samples-data-YYYYMMDD

Explore
- Discover: /discover shows recent published lists
- Sample user index: /samples lists all sample users
- User profile: /user/sample-001 (and other sample handles)
- Item hubs: Use search for global items (e.g., "Espresso", "The Matrix")

Flags
- User.isSample, User.seedBatch; List.isSample, List.seedBatch; Item.isSample, Item.seedBatch
- Safe cleanup: items are deleted only if sample+batch and not referenced by any lists
