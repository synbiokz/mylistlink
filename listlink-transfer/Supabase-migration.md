Supabase Migration Runbook (Nano Plan)

Goal: Move the app database from local SQLite to a fresh Supabase Postgres project named "listlink" under org "MyListLink", with staged verification and rollback.

Prereqs
- Supabase account with permissions to create an org and a project
- Local Node + pnpm
- This repo checked out

Project Creation (Dashboard)
- Create Organization: name "MyListLink"
- Create Project: name "listlink", plan Nano, choose a nearby region
- Set a strong DB password and store it securely
- Collect connection strings from Settings → Database:
  - Pooled URL (pgbouncer, port 6543) → use for `DATABASE_URL`
  - Direct URL (port 5432) → use for `DIRECT_URL` (Prisma migrations)

Local Environment
- Add to `.env.local` (root) or `apps/web/.env.local`:
  - DATABASE_URL="postgresql://postgres:<PW>@db.<ref>.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1&connect_timeout=10"
  - DIRECT_URL="postgresql://postgres:<PW>@db.<ref>.supabase.co:5432/postgres?sslmode=require"
- Keep NEXTAUTH_URL/NEXTAUTH_SECRET/OMDB_API_KEY as before

Prisma Schemas
- SQLite (current dev): `apps/web/prisma/schema.prisma`
- Postgres (new): `apps/web/prisma/pg/schema.prisma` (added)
  - Uses `provider = "postgresql"` and `directUrl`

Migrations (Postgres)
- In `apps/web` dir:
  - pnpm exec prisma migrate dev --schema prisma/pg/schema.prisma --name init_pg
  - pnpm exec prisma generate --schema prisma/pg/schema.prisma

Run Locally Against Supabase
- PowerShell (example):
  - $env:DATABASE_URL='postgresql://...6543/...'; $env:DIRECT_URL='postgresql://...5432/...'
  - pnpm dev

Seeding Against Supabase
- Ensure `DATABASE_URL` points to Supabase (Pooled URL)
- Assign batches:
  - pnpm --filter web run seed:assign-batches
- Seed lists:
  - PowerShell:
    $env:DATABASE_URL='postgresql://...6543/...'; pnpm --filter web run seed:lists -- --batches 1,2,3,4 --batch-name samples-data-YYYYMMDD --lists-per-user 2

Validation Checklist
- App boots (`pnpm dev`) without DB errors
- /discover shows recent published lists
- /samples lists sample users; /user/sample-001 shows lists
- /api/suggest and /api/search return expected payloads
- Create → publish a list works end‑to‑end

Rollback
- Point `DATABASE_URL` back to SQLite (e.g., file:./apps/web/prisma/dev.db) and restart app

Notes
- Use pooled `DATABASE_URL` for runtime; use `DIRECT_URL` for migrations
- Windows: set env vars with `$env:VAR='value'` before commands
