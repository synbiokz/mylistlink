# ListLink Books

Book-only MVP for expressive 7-book lists and overlap-based discovery.

## Product scope

- Public lists of exactly 7 books
- Canonical book pages sourced from Open Library
- Overlap discovery between published lists
- Lightweight social actions: likes and saves

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth credentials login for local MVP auth

## Local setup

1. In `apps/web`, copy `.env.example` to `.env.local` and `.env`.
2. Point `DATABASE_URL` at a local PostgreSQL database.
3. Generate the Prisma client:

```bash
pnpm db:generate:web
```

4. Push the schema:

```bash
pnpm db:push:web
```

5. Start the app:

```bash
pnpm dev:web
```

6. Validate the workspace-scoped checks:

```bash
pnpm lint:web
pnpm typecheck:web
pnpm build:web
```

## Architecture notes

- One Prisma schema in `apps/web/prisma/schema.prisma`
- Canonical domain models: `User`, `Author`, `Book`, `List`, `ListItem`
- External ingestion is limited to Open Library search and local canonicalization
- Book/list/profile/discover routes are the only product surfaces
- Follow UI, moderation, and analytics are intentionally deferred in this MVP
