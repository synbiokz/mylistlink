# Original Implementation Plan: Work-Centric Typing and Crosses for MyListLink

## Summary
Adopt a Work-centric data model so crosses are precise and types are enforced. Create first-class `Work` entities with strict `kind` typing and normalize external identifiers into an `ExternalId` table. Update list composition, search, and overlaps to operate on Works instead of free-form strings or loosely defined items.

## Data Model
- Add tables/models:
  - `Work(id, kind, title, year, creator, qid, createdAt, updatedAt)`
  - `ExternalId(id, workId → Work.id, authority, extId)` with unique `(authority, extId)`
  - `WorkMeta(workId → Work.id, summary JSONB)` for compact source payloads
  - `ListWork(listId → List.id, workId → Work.id, addedAt)` as the new link table used by overlaps
- Postgres support:
  - Enable `pg_trgm` extension for fuzzy title matching
  - Indexes: `Work.title` trigram, `ExternalId(authority, extId)`, `ListWork(listId)`, `ListWork(workId)`

## Migration
1) Add the new schema objects (`Work`, `ExternalId`, `WorkMeta`, `ListWork`) and indexes.
2) Backfill from existing data:
   - For each `Item`, create one `Work` with `kind` inferred (Book/Movie/etc.) and copy `title`/`year`/`creator` if known.
   - For each alias or source ID, insert `ExternalId` rows.
   - For each `ListItem`, insert the corresponding `ListWork(listId, workId)`.
3) Remove direct dependencies on `Item` in overlaps/trending/search once backfill is complete.

## Resolver Pipeline (sources → Work)
- Deterministic resolution when an authority ID is present:
  - OMDb: imdbID → `ExternalId('imdb', tt...)`
  - OpenLibrary: prefer the Works endpoint → `ExternalId('openlibrary_work', olw:...)`
  - Wikidata: `ExternalId('wikidata', Q...)` and set `Work.qid` when available
- Heuristic resolution when only free text is provided:
  - Normalize `(title, creator, year)` and search `Work` using `pg_trgm` on `title` with optional `creator` filtering
  - If nothing matches within threshold, create a new `Work` and continue

## API Changes
- Add:
  - `POST /api/works/resolve` to map external inputs into a `Work` (and `ExternalId` upserts)
  - `POST /api/lists/:id/works/set` to place a `workId` at a position (1..7)
- Update existing flows to call the Work resolver in place of legacy item resolution.

## UI Changes
- Create/edit flow: selection stores `workId` per slot; display `title`, `year`, and `kind` badge.
- List pages and item hubs become Work pages; use `workId/slug` for routing.

## Overlaps, Trending, Suggest
- Overlaps: share counts by `ListWork.workId` across lists.
- Trending: top Works by appearance in published lists.
- Suggest: unchanged structure; source data comes from Works.

## Performance
- Indexes listed above
- `pg_trgm` for fuzzy matching
- Short cache for suggest/home rails; bound expensive overlap calculations

## Testing
- Unit: Work resolver from OMDb/OpenLibrary/Wikidata into `Work`/`ExternalId`
- Integration: set/move slots with Works; publish; overlaps and search reflect new model
- Data migration: verify row counts and random samples after backfill

## Rollout
- Apply schema
- Run backfill scripts
- Switch overlaps/trending/search to Work reads
- Update UI to store/use `workId`
