# Revised Implementation Plan: Work-Centric Typing and Crosses for MyListLink

This plan explicitly follows an incremental rollout (dual‑write + shims) to reach a clear, Work‑centric end‑state. Think of it as two phases:
- Phase A (Migration & Shims): Safely add Work, dual‑write, and cut reads over with minimal user disruption.
- Phase B (End‑State): Remove shims and legacy Item reads, converge on the clean conceptual model from the Original plan.

## Summary
Move from string- or item-centric list entries to a Work-centric model so overlaps (“crosses”) are precise. Introduce `Work` as the canonical entity, map external identifiers into a normalized `external_id` table, and update the list composition, search, and overlap logic to operate on Works. Deliver this incrementally with dual-write shims, backfill, and safe fallbacks. Optimize with Postgres-native indexes, extensions, and caching.

## Current State (as of repo)
- DB: Supabase Postgres via Prisma; existing schema includes `User`, `List`, `Item`, `ListItem`, `ItemAlias`, and vibes/lineage relations; overlaps and rails compute using `Item` appearances across published lists.
- Sources: OMDb, OpenLibrary, Wikidata fetchers resolve external items and upsert into `Item`.
- UI: Create flow sets 7 slots; overlaps rails derive from `Item`-based counts; search mixes users/lists/items.

## Goals
- Accurate crosses: two lists cross only when they share the same Work (e.g., The Hobbit novel), not an ambiguous title string.
- Robust typing: `Work.kind` (Book, Movie, TVSeries, Album, Track, Comic, Game, Other) drives downstream logic.
- External authority IDs: Deduplicate via `external_id` with unique `(authority, ext_id)`.
- Incremental rollout: No downtime, preserve current UI contracts via shims.

## Non‑Goals (now)
- Replacing NextAuth with Supabase Auth.
- Building a full curator UI; we’ll stage a simple review queue but ship auto-resolution first.

## Data Model (Prisma/Postgres)
Add new models alongside existing ones. Keep `Item` for compatibility during cutover.

```prisma
// apps/web/prisma/pg/schema.prisma (additions)
enum WorkKind {
  Book
  Movie
  TVSeries
  Album
  Track
  Comic
  Game
  Other
}

model Work {
  id        Int       @id @default(autoincrement())
  kind      WorkKind
  title     String
  year      Int?
  creator   String?
  qid       String?   @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  meta      WorkMeta?
  ids       ExternalId[]
  listItems ListWork[]
}

model ExternalId {
  id        Int    @id @default(autoincrement())
  workId    Int
  work      Work   @relation(fields: [workId], references: [id])
  authority String
  extId     String
  @@unique([authority, extId])
}

model WorkMeta {
  workId  Int    @id
  work    Work   @relation(fields: [workId], references: [id])
  summary Json
}

// New link table (parallel to ListItem) during migration
model ListWork {
  listId Int
  workId Int
  addedAt DateTime @default(now())
  list   List @relation(fields: [listId], references: [id])
  work   Work @relation(fields: [workId], references: [id])
  @@id([listId, workId])
}
```

Postgres indexes/extensions (via migration SQL):
- `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- `CREATE INDEX idx_work_title_trgm ON "Work" USING gin (title gin_trgm_ops);`
- `CREATE UNIQUE INDEX idx_external_id ON "ExternalId"(authority, extId);`
- `CREATE INDEX idx_listwork_list ON "ListWork"(listId);`
- `CREATE INDEX idx_listwork_work ON "ListWork"(workId);`

Compatibility view (optional):
- Create a SQL view `ItemView` mapping legacy `Item` to `Work` for read-only UI surfaces during cutover if needed.

## Migration Plan
1) Schema add (safe): add `Work`, `ExternalId`, `WorkMeta`, `ListWork` and extensions/indexes.
2) Backfill Works from Items:
   - For each `Item`, create `Work` with best-effort `kind` (heuristic from aliases/source) and title.
   - Create `ExternalId` rows from existing `ItemAlias` and `Item.normalizedKey` as fallback authorities (e.g., `alias:omdb:tt...`).
   - For each `ListItem`, create `ListWork(listId, workId)` using the mapped `Work`.
3) Dual-write period:
   - Update item resolution endpoint to upsert both `Item` and `Work`/`ExternalId` (write-through) while UI still reads `Item`.
4) Cutover reads:
   - Switch overlaps, trending, and search to use `Work` and `ListWork` exclusively.
   - Keep a shim so older responses still include legacy fields for a short period.
5) Cleanup:
   - Stop writing `Item`/`ListItem`.
   - Migrate UI clients fully to `Work` IDs and remove shims.

### End‑State Convergence (Phase B)
- Remove legacy tables and code paths that operate on `Item` once telemetry shows stable behavior.
- Ensure all public APIs and UI routes use Work identifiers and semantics (e.g., hubs → Work hubs).
- Keep only the deterministic + well‑bounded heuristic resolver; curator queue becomes optional operational tooling.

End‑state mirrors the Original conceptual model: precise crosses by shared Work, strict typing via `Work.kind`, and authority‑first resolution.

## Resolver Pipeline (sources → Work)
- Deterministic stage (authority IDs):
  - OMDb: imdbID → `ExternalId(authority='imdb', extId=tt...)` → reuse existing Work if found.
  - OpenLibrary: prefer Works API; map `openlibrary_work` and also retain edition IDs if available.
  - Wikidata: map `wikidata:Q...`; set `Work.qid` if known.
- Heuristic stage (no authority ID):
  - Normalize `(title, creator, year)`; search `Work.title` with `pg_trgm` + optional `creator` filtering.
  - If confidence high → attach to existing Work; else create new Work and flag for review.
- Curation queue (later):
  - Table `work_review` to capture uncertain matches with suggested candidates for human approval.

## API Changes (backward compatible)
- New endpoints:
  - `POST /api/works/resolve` → returns `{ work, created, externalIds }`.
  - `POST /api/lists/:id/works/set` → sets a slot by Work (maintain existing `/items/set` and map internally).
- Shims:
  - `/api/items/resolve` continues to work; implementation calls the Work resolver, then ensures legacy `Item` row exists.

## UI Changes
- Create flow: use the same search UI; selection now resolves to a `Work`. Slot state keeps `workId`.
- List page: display Work `title`, optional `year`, and `kind` badge.
- Item hubs → Work hubs: `/work/[slug]` (or re-use `/item/[slug]` routing with `Work` data).

## Overlaps, Trending, Suggest
- Overlaps: compute on `ListWork` (shared Work count, not Item).
- Trending items: group by `ListWork.workId`.
- Suggest: recent lists unchanged; hot items = top Works.

### Exit Criteria to End‑State
- All overlaps, search, and rails read from Work‑based tables only.
- No dual‑writes observed in logs for > N days; shims disabled behind flag.
- Deletion/updates happen via Work APIs with no reliance on legacy Item paths.

## Performance & Caching
- Add `revalidate(60)` to Home/Discover; cache `/api/suggest` 30–60s.
- Keep `hotOverlaps` bounded, or compute from a materialized view periodically.
- Ensure all new tables have the indexes listed above.

## Testing Plan
- Unit: resolver mapping from OMDb/OpenLibrary/Wikidata into `Work`, `ExternalId`.
- Integration: slot set/move with `Work`, publish, search, overlaps.
- Migration scripts: dry-run backfill on a copy; verify row counts and random samples.
- E2E: author a list, resolve different authorities, ensure crosses appear only when sharing the same `Work`.

Add canary dashboards for:
- Dual‑write parity (ListItem vs ListWork counts per list).
- Resolver confidence and fallback rates.
- Overlaps query latency and cache hit rates.

## Rollout & Safety
- Feature flag for Work reads; dual-write period of at least one full day of internal testing.
- Backups and revert plan: can switch reads back to `Item` quickly.
- Logs/metrics: timing logs around resolver and overlaps; monitor P95.

## Shortcomings/Risks Identified and Solutions
- Ambiguity in title-only matches: use `pg_trgm` thresholds and require `creator`/`year` to auto-link; otherwise queue for review.
- Authority fragmentation (IMDb vs TMDb vs EIDR): normalize to a small authority set; optionally pull Wikidata QIDs to unify.
- Migration consistency: dual-write during cutover; add constraints and unique indexes first; backfill in batches.
- Performance on overlaps: move to a single SQL or materialized view; cache in memory with short TTL if needed.
- UI churn: maintain shims (`/items/resolve`, legacy fields) through the cutover; only remove after verification.
