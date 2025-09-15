# LinkList — Running Summary (07Sep2025)

## Overview
- Built an MVP Next.js app (apps/web) with Prisma/SQLite, pnpm workspace, and a clean UI component set. Core pages include marketing, discover, create flow, item/list detail, and user profiles.
- Implemented dev-friendly authentication with NextAuth Credentials provider that doubles as signup by creating a user record on first login.
- Protected authoring routes (e.g., `/create`) behind middleware that redirects unauthenticated users to the sign-in page and returns to the intended destination.
- Added initial API routes for list creation, item upsert, publishing, search sources, and health/debug checks. Data models include Users, Lists, Items, and social interactions (follows, likes, saves, comments).

## Signup / Auth Flow
- Sign-in UI: `apps/web/src/app/signin/page.tsx`
  - Simple form (email + optional name) using `next-auth/react` `signIn("credentials")`.
  - On submit, redirects to `/create` via `callbackUrl`.
- NextAuth route: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
  - Uses `Credentials` provider for a “Dev Login.”
  - In `authorize`, looks up a user by email; if none exists, it creates one (implicit signup):
    - Generates a `handle` from provided `name` or email user part via `slugify`, enforcing uniqueness (e.g., `name`, `name-1`, ...).
    - Persists the new `User` with `email`, optional `name`, and `handle` in Prisma.
  - Session strategy is JWT; `session` callback attaches `user.id` (as number) to the session.
- Middleware protection: `apps/web/src/middleware.ts`
  - Checks token (via `getToken`) for protected paths (currently `/create`).
  - Redirects to `/signin?callbackUrl=/create` if missing.
- Server-side session helper: `apps/web/src/lib/auth.ts`
  - `requireSession()` wraps `getServerSession(authConfig)`, returns `null` if unauthenticated.
  - Used by authoring APIs to enforce ownership.
- Prisma auth models: `apps/web/prisma/schema.prisma`
  - Includes `User` plus NextAuth tables: `Account`, `Session`, `VerificationToken` (adapted for Int `userId`).
  - DB: SQLite via `DATABASE_URL` with path auto-resolved in `apps/web/src/lib/prisma.ts`.

## Authoring and Data Flow
- Create List page (client): `apps/web/src/app/create/page.tsx`
  - Step 1: Create draft via `POST /api/lists`.
  - Step 2: Search external items and place into 7 positions; publish when all are set.
- Authoring APIs (all require session and enforce ownership):
  - `POST /api/lists` → create draft list for current user.
  - `POST /api/lists/[id]/items` → add or update item at a position; resolves external items.
  - `POST /api/lists/[id]/publish` → publish user’s own draft list.
- Supporting data modules: `apps/web/src/data/*` for lists/items/users and utilities.
- Public browsing:
  - Home (`/`) and Discover pages show recent/trending placeholders.
  - User profile: `apps/web/src/app/user/[handle]/page.tsx` shows published lists for a user.

## UI / Navigation
- Global nav: `apps/web/src/components/layout/NavBar.tsx`
  - Shows `Create List` and `Sign in`; the create flow is guarded by middleware.
- Reusable UI components under `apps/web/src/components/ui/*` and domain-specific components under `.../domain/*`.

## Configuration / Environment
- Env files:
  - Root `.env.local` and `apps/web/.env.local` include `DATABASE_URL`, `OMDB_API_KEY`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
- Prisma client: `apps/web/src/lib/prisma.ts` resolves a file-based SQLite path for local dev across monorepo roots.

## Notable Decisions
- Auth as dev-friendly Credentials login with implicit signup (no email verification yet). Suitable for local MVP, not for production.
- JWT sessions for simplicity; DB auth tables are scaffolded for future providers.
- Minimal client session usage; server APIs gate access via `requireSession()`.

## Gaps / Next Steps (Auth)
- Replace dev Credentials with a production-ready provider (email magic-link or OAuth) and add email verification.
- Add sign-out and account UI (profile editing, avatar upload, change handle with checks).
- Expand middleware-protected surface (draft management, edit list, likes/saves/comments if needed).
- Add rate limiting and basic abuse protections for auth endpoints.
- Write tests for signup, session propagation, and ownership checks.

## This Session’s Accomplishments
- Confirmed branch: `feat/mvp` and reviewed the codebase with focus on signup.
- Verified end-to-end auth/signup behavior:
  - Sign-in page posts to NextAuth Credentials.
  - First login creates a `User` with a unique `handle` (implicit signup).
  - Middleware correctly protects `/create` and preserves `callbackUrl`.
  - Server APIs consistently enforce authenticated ownership.
- Documented the end-to-end flow and identified concrete next steps to productionize auth.

## 09Sep2025

### Overview
- Implemented M1 “Contracts & Semantics” for the 7‑slot editor: atomic set/move/replace with idempotency and server‑authoritative slot snapshots. Kept legacy endpoints working via shims.
- Wired the Create page to consume server `{ slots }`, enabling replace/move and per‑slot removal; added lightweight user notices.
- Fixed a build error on overlaps import; confirmed list creation and item placement flows.

### Key Changes — Server
- Endpoints
  - `POST /api/lists/[id]/items/set`: Atomic set/move/replace, body `{ itemId, position, clientRequestId? }`, returns `{ slots }`.
  - `DELETE /api/lists/[id]/items?position=n`: Removes occupant at `n`, returns `{ slots }`.
  - Shim: `POST /api/lists/[id]/items` now delegates to atomic setter and also returns `{ slots }` (keeps legacy `{ link }`).
  - `GET /api/lists/drafts/latest`: Adds `draft.slots` (normalized 7‑slot snapshot) alongside existing `positions`.
  - `POST /api/items/resolve`: Normalized response (`itemId, slug, title, type?, image?, source, sourceId, url`) + light rate limit + `X‑Request‑ID`.
  - `GET /api/sources/search`: Short‑TTL in‑memory cache keyed by `q+type`, light per‑IP rate limit, latency logging.
- Data/Transactions
  - `setSlotAtomic(listId, itemId, position)`: One transaction implementing move/replace; on constraint race, return `CONFLICT_POSITION` with fresh snapshot.
  - `removeSlot(listId, position)` and `getSlotsSnapshot(listId)` added.
- Infra Utilities
  - In‑memory idempotency store `(listId, clientRequestId)` (10‑min TTL).
  - Request helpers: `X‑Request‑ID` generation/echo; simple token‑bucket rate limiting.
  - Resolve memo: write‑through cache `(source,sourceId) → itemId` to prevent thundering herds.

### Key Changes — UI (Create Page)
- Replace/Move: Slot selection no longer disabled when occupied; selection calls new atomic endpoint and reconciles from server `{ slots }`.
- Remove: Per‑slot “remove” action wired to `DELETE …/items?position=n` with immediate snapshot refresh.
- Autosave/Resume: On load, prefer `draft.slots` from server; local state always replaced by server snapshots after mutations.
- Feedback: Added a simple notice strip for conflict/errors; publish button auto‑gates on server‑backed filled count (7/7).

### Fixes
- Build: Implemented `overlapsForList` in `apps/web/src/data/overlaps.ts` to satisfy import in list page (Turbopack build error resolved).

### Successes
- Slot semantics now correct on the server: atomic, idempotent, race‑safe; UI can change, move, and remove items reliably.
- Legacy flows preserved; list creation and item placement work end‑to‑end.
- Observability improved: request IDs, structured logs, basic rate limits, and search caching.

### Failures / Gaps
- UX polish pending: no toasts with specific codes (`DUPLICATE_ITEM`, `CONFLICT_POSITION`), only a simple notice.
- A11y/keyboard flows for per‑slot search not implemented (global search remains separate).
- No DB/Redis store for idempotency/rate limits (in‑memory only; acceptable for dev, not prod).
- Limited validation messaging surfaced in UI; needs mapping from error taxonomy.

### Next Actions (Immediate)
- UI
  - Map server error codes to user toasts: duplicate moved, replace, remove, conflict refresh.
  - Show per‑slot state while pending (disable buttons/spinner) and handle retry for non‑200s.
  - Keyboard/A11y: focus a slot, navigate numbers via keyboard, Enter to select.
- API/Infra
  - Add explicit error code for “moved to slot N” on duplicate set; include `movedTo` in payload.
  - Tighten input validation (zod) and unify error shapes across authoring endpoints.
  - Optional: add Redis toggle for idempotency/rate limits in prod configs.
- Testing
  - Unit: transactional set (replace/move/remove) under concurrency.
  - API: auth gates, invalid input, publish validation, rate‑limit paths.

### Runbook (Dev)
- Start: `pnpm dev:web`
- Env: set `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `OMDB_API_KEY` in `apps/web/.env.local` (SQLite DB path already handled).
- Verify:
  - Create draft → add 7 items → replace/move/remove respond with immediate snapshot.
  - Publish only when `{ slots }` shows 7/7.

## 12Sep2025

### Summary
- High-level goals achieved: (1) UI auth experience made provider/DB-agnostic and immediately reflective of sign-in state, (2) sample data pipeline added for demo/browse surfaces with safe cleanup, (3) project context doc from Google Docs captured into repo.
- Technical scope: strictly UI and dev-data surfaces; no breaking API changes; contracts/types preserved to keep future backend swaps (e.g., Supabase) frictionless.

### UI Auth Improvements (DB/Auth-agnostic)
- Adapter-first design: extended services layer to fully encapsulate auth calls.
  - File: `apps/web/src/services/types.ts`
    - Added `auth.signIn(input)` and `auth.signOut(input)` to the `AuthService` interface.
  - File: `apps/web/src/services/apiAdapter.ts`
    - Implemented `auth.signIn`/`auth.signOut` using dynamic imports of `next-auth/react` to avoid direct coupling in components. `auth.getSession()` unchanged; still contract-based via `/api/auth/session`.
- Header state now reflects auth instantly.
  - File: `apps/web/src/hooks/useMe.ts`
    - Query tuned for immediacy: `staleTime: 0`, `refetchOnMount: "always"`, `refetchOnWindowFocus: true`.
  - File: `apps/web/src/components/layout/NavBar.tsx`
    - Replaced static “Sign in” when authenticated with avatar + handle and a menu: “My Lists”, “Create List”, “Sign out”.
    - Sign-out wired to adapter; upon sign-out UI flips immediately back to “Sign in”.
- Sign-in page now provider-agnostic and callback-aware.
  - File: `apps/web/src/app/signin/page.tsx`
    - Uses `services.auth.signIn({ provider: 'credentials', email, name, callbackUrl })`.
    - Respects `?callbackUrl`, defaults to `/create`.
    - Improved copy; no backend detail leakage in UI.

### Sample Data Flags and Seeding
- Prisma schema: user-level tagging for sample/demo segregation.
  - File: `apps/web/prisma/schema.prisma`
    - Added `User.isSample Boolean @default(false)` and `User.seedBatch String?`.
    - Applied with `prisma db push` against SQLite dev DB.
- Seed + maintenance scripts (all under `apps/web/scripts/`):
  - `seed-samples.js`: Inserts 50 users with emails `sample+NNN@example.com`, handles `sample-NNN`, `isSample = true`. Accepts optional batch name input; otherwise stamps a timestamped `seedBatch`.
  - `assign-sample-batches.js`: Deterministically sets `seedBatch` into five groups (`samples-batch-1` … `samples-batch-5`) of 10 users using numeric suffix.
  - `remove-samples.js`: Safe deletion by batch (dependencies first: comments/likes/saves → follows → listItems → lists → users). Accepts either a number (e.g., `5`) or a name (`samples-batch-5`).
  - `query-users.js`: Utility to dump `{ id, email, handle, isSample, seedBatch }` for verification.
- NPM scripts in `apps/web/package.json`:
  - `db:migrate` (placeholder), `seed:samples`, `seed:assign-batches`, `seed:remove`.

### Artifacts Imported for Context
- Saved Google Doc (UI/auth guidance) to `listlink-transfer/` as:
  - `shared-doc.pdf`, `shared-doc.docx`, `shared-doc.txt` (used for plan extraction).

### Validation
- Manual run confirms: after sign-in, top-right updates from “Sign in” to avatar/handle menu immediately; sign-out reverts instantly.
- Seeding: 50 users created and distributed into 5 batches; batch 5 removed via script; query script shows correct flags.

### Commands (Runbook)
- Dev server: `pnpm dev:web`
- Env: ensure `DATABASE_URL`, `OMDB_API_KEY`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` set (see `.env.local`).
- Seed users: `pnpm --filter web run seed:samples`
- Assign batches: `pnpm --filter web run seed:assign-batches`
- Remove a batch: `pnpm --filter web run seed:remove 5` (or `samples-batch-5`)
- Query users: `DATABASE_URL="file:$(pwd)/apps/web/prisma/dev.db" node apps/web/scripts/query-users.js`

### Technical Notes / Best Practices Anchors
- UI remains DB/Auth-provider agnostic by confining identity logic to the `services` adapter and stable HTTP contracts (`/api/auth/session`, `/api/users/me`).
- Adapter’s dynamic import avoids bundling provider specifics into server components and keeps swap path open (e.g., Supabase Auth adapter).
- React Query configuration chosen to eliminate stale header state after auth events without broad, wasteful polling.
- Sample tagging uses booleans + batch keys for safe query, audit, and deletion.

### Next Actions (UI-focused)
- Add outside-click and focus-trap behaviors to the avatar menu for a11y polish.
- Map server error codes to toasts in create flow; maintain DB-agnostic UI.
- Optional: create seed lists/items for sample users (tag with `isSample`, `seedBatch`) to light up Discover/Overlaps surfaces.
- Prepare a `supabaseAdapter` implementing `AuthService` to validate the swap boundary (no UI changes required).

### File Deltas (Today)
- Modified: `apps/web/src/services/types.ts`, `apps/web/src/services/apiAdapter.ts`, `apps/web/src/hooks/useMe.ts`, `apps/web/src/components/layout/NavBar.tsx`, `apps/web/src/app/signin/page.tsx`, `apps/web/prisma/schema.prisma`, `apps/web/package.json`.
- Added: `apps/web/scripts/seed-samples.js`, `apps/web/scripts/assign-sample-batches.js`, `apps/web/scripts/remove-samples.js`, `apps/web/scripts/query-users.js`.
- Added (assets): `listlink-transfer/shared-doc.{pdf,docx,txt}`.

### Risks / Constraints
- Current scripts assume SQLite path; in CI/prod, switch to environment-provided `DATABASE_URL` and gate destructive scripts by env guard.
- Nav menu lacks outside-click close; minor UX gap.
- No sample lists yet; discovery rails remain sparse until seeded.

### 12Sep2025 — Additions (Search, Suggestions, Home Rails)

#### Overview
- Implemented production-safe suggestions and search that work for any real user (e.g., “Harvey”) without relying on seeded data.
- Populated the home page with real data rails (Trending Items, Hot Overlaps) backed by published content.
- Added developer references documenting the adapter boundary and sample-data runbooks; added a simple `/samples` index for quick demo navigation.

#### API/Data Changes
- Search (lists/users):
  - `GET /api/search?q=...` now returns `lists` (published, title contains, case-insensitive) and `users` (handle/name contains, case-insensitive) alongside legacy `items`.
  - File: `apps/web/src/app/api/search/route.ts`
  - File: `apps/web/src/data/search.ts` (case-insensitive filters, minimal selects)
- Suggestions endpoint (no-auth, no seeds needed):
  - `GET /api/suggest` returns `{ recentLists, topUsers, hotItems }`:
    - `recentLists`: latest published lists
    - `topUsers`: users by published list count
    - `hotItems`: items by appearance count in published lists
  - File: `apps/web/src/app/api/suggest/route.ts`
- Rails helpers:
  - Trending items: `trendingItems(limit)` in `apps/web/src/data/items.ts` (orders by `listItems` count across published lists; returns id/slug/title/count)
  - Hot overlaps: `hotOverlaps(sample, take)` in `apps/web/src/data/overlaps.ts` (samples recent published lists, computes best overlap mate with count/similarity)

#### UI Changes
- SearchBox (suggestions + mixed results):
  - Empty focus shows suggestion bubbles from `/api/suggest`: hot items, recent lists, top users (click to navigate).
  - Typing (≥2 chars) shows mixed results:
    - Users first (→ `/user/[handle]`)
    - Lists next (→ `/list/[slug]`)
    - External items last (resolve → `/item/[slug]`)
  - File: `apps/web/src/components/search/SearchBox.tsx`
- Home page rails populated:
  - Trending Items (links to item hubs)
  - Hot Overlaps (pairs of lists with overlap counts)
  - File: `apps/web/src/app/page.tsx`
- Sample users index:
  - Route: `/samples` shows all sample users (handle/name) with profile links.
  - File: `apps/web/src/app/samples/page.tsx`

#### Developer References
- Adapter boundary: `listlink-startup/adapter-boundary.md` — interfaces, files, and cache/eventing guidance for provider/DB agnosticism.
- Sample data runbook: `listlink-startup/sample-data.md` — end-to-end commands for seeding/assigning/removing users and lists.

#### Validation (Prod-like)
- Suggestions and mixed search work with real published content; if the DB has no content, endpoints return empty arrays gracefully.
- Rails derive entirely from published data; they “just work” as users create lists (no in-memory dependencies).
- Harvey test plan:
  - Header reflects auth (from prior work).
  - Click Search (empty): see suggestion bubbles; click to navigate to items/lists/users.
  - Type (≥2 chars): see users/lists/external items; select list/user to navigate.
  - Visit Home: Trending Items and Hot Overlaps show entries if content exists.

#### Next Actions
- Surface vibes (chips) and lineage (breadcrumbs) on list pages to make the network more visible without DB inspection.
- Consider a full `/search` results page with tabs (Users/Lists/Items) and pagination.
- Tweak hot overlaps to a single SQL (when on Postgres) and add basic caching.
## Session Summary - 2025-09-14

### High-Level Overview
- Migrated DB to Supabase (Nano) with Postgres Prisma schema (pg) alongside existing SQLite for dev. Implemented dual URLs (pooled DATABASE_URL 6543, DIRECT_URL 5432) and applied initial migrations.
- Seeded Supabase with sample users and lists; then wiped lists to restart with Work-centric dual-write in place.
- Implemented a Work-centric foundation (Work, ExternalId, WorkMeta, ListWork, ItemWork) and dual-write shims, with UI and API refinements (grouped search) to reduce duplication and improve Create flow UX.
- Fixed several Next.js/route/type issues, improved Create layout, and added in-memory caching + debounce to speed search UX.

### Chronological Technical Successes
1) Supabase Setup & Migration
- Created apps/web/prisma/pg/schema.prisma; added Postgres datasource and directUrl.
- Applied migrations: init_pg, then dd_work_models, then dd_item_work_mapping (added Work, ExternalId, WorkMeta, ListWork, ItemWork).
- Enabled pg_trgm and created GIN trigram index for lower(title) in Work; added btree indexes per table.
- Verified with Prisma migrate status and SQL probes.

2) Env & Runtime Hardening
- Consolidated env: apps/web/.env (Supabase pooled & direct). Ensured Prisma CLI loads .env by default; kept apps/web/.env.local for Next runtime.
- Documented in Supabase-migration.md and .env.example cleanups.

3) Seeding & Reset
- Seeded 50 sample users; assigned batches; seeded 40 published lists via node scripts (PowerShell-friendly). Verified counts.
- Created a wipe script to remove lists and dependencies; reset DB to clean slate for Work-centric rollout.

4) Dual-Write Work Foundation (Phase A)
- Added Work models and link tables; dual-write in items/resolve, lists/[id]/items and lists/[id]/items/set:
  - Upsert Work + ExternalId on external resolve.
  - Map Item->Work via ItemWork.
  - On slot set, upsert ListWork if ItemWork exists.

5) API & UI Fixes
- Updated dynamic route handlers to Next 15 params typing (ctx.params Promise) and adjusted NextAuth event types.
- Fixed build error (duplicate prisma import).
- Home performance guard: added timeout fallback and reduced overlaps sampling. Replaced mojibake separator and sanitized strings.
- Create page UI:
  - Two-column layout (12-col grid): Items = 4/12 (single-column 7 slots), Search = 8/12 (tall, readable titles, larger thumbnails).
  - Fixed step auto-advance to require explicit Continue; pointer cursor styling.

6) Grouped Search (Work-first)
- New endpoint /api/search/grouped groups results by Work/authority for books and by IMDb for film/TV, with fallback normalized (title+creator) clustering.
- Added cross-authority merge by normalized (title+creator) within same kind; representative selection preference (OL for books, OMDb for film/TV).
- Added in-memory 30s cache and Create page debounce (300ms) to reduce latency under typing.
- Enriched sources: OpenLibrary (author_name ? creator, first_publish_year ? year), OMDb (Year ? year).
- Added types GroupedWorkItem, GroupedSearchResponse and wired a new useGroupedSearch hook + services API.

### Thematic Overview by Success
- Data Layer: Supabase migration + dual-write Work model establish a safe path to Work-only reads later; indexes and extensions in place.
- Search & UX: Grouped search reduces duplicate rows and is ready for a �More versions� UX; Create page is now ergonomic (single panel slots, readable search list).
- Stability & Performance: Route typings fixed; caching and debounce added; Home page guard to avoid timeouts.

### Technical Challenges
- Duplication (e.g., "The Master and Margarita"): Cross-language labels and editions from OL/Wikidata can splinter without a shared authority ID.
  - Current: Coalesces by OL Work or by normalized (title+creator); cross-authority merge attempts to absorb matching labels.
  - Outstanding: Add transliteration-aware normalization and prefer absorbing Wikidata entries into an OL Work cluster when creator matches; add �More versions� for editions/translation visibility; store aliases/QIDs on selection to make future matches deterministic.
- Next 15 route typing inconsistencies: Resolved for [id] handlers (ctx.params Promise) and NextAuth event typing.
- Home load regressions: Added timeout fallback and reduced overlaps sampling; consider precomputed overlaps or a mat. view for production.
- Windows shell differences: Standardized PowerShell-friendly commands for env and scripts.

### Primer: Next Session Steps (Technically Scoped)
1) Strengthen Book Unification (request-time, fast):
- In /api/search/grouped, when an OL Work cluster exists, absorb Wikidata items that match normalized creator and have similar title (transliteration-aware). Maintain kind safety.
- Implement transliteration map for common scripts (Cyrillic ? Latin) within normalization; limit to search-time only.
- Add a small expand=1 UI affordance (More versions) in Create to reveal editions/translations when needed.

2) Post-Selection Determinism (slow path, once per Work):
- When a grouped row is selected, resolve missing authorities (e.g., fetch Wikidata details once) and attach to Work (ExternalId), record title aliases in WorkMeta. Next time, search coalescing is deterministic.

3) Flip Reads to Work (behind a flag):
- Implement Work-based overlaps/trending using ListWork, with a feature flag comparing parity to Item-based rails; add short TTL caching.
- Monitor latency and correctness; flip defaults when confidence is high.

4) Performance & Monitoring:
- Add simple timings to grouped search (server) and Create search (client) to measure P95; report cache hit rate.
- Plan materialized view for overlaps on production; revalidate Home/Discover; keep PgBouncer for runtime.

5) Docs & Cleanup:
- Update listlink-startup/typing-plan-revised.md with final grouped endpoint contract.
- Add dev note for bypassing search cache (e.g., 
ocache=1).
