# Search Unification, Grouping, and Confidence (Design Spec)

Purpose
- Return one row per Work (per format) in search results by grouping heterogeneous source results (OpenLibrary, OMDb, Wikidata) into a canonical Work cluster.
- Keep selection simple (one click per Work). Offer an optional “More versions” drill‑down for editions/translations.
- Persist authoritative identifiers when a selection is made to make future resolutions deterministic.

Scope
- Applies to request‑time search aggregation and grouping.
- Persists decisions via the existing Work/ExternalId/WorkMeta models.
- Does not change current UI immediately; provides a new grouped endpoint and types to adopt progressively.

Data Sources & Authority
- Books: OpenLibrary Work key (e.g., /works/OL123W) is the canonical authority. Editions/ISBNs resolve up to the Work.
- Film/TV: OMDb → IMDb IDs (tt..). Keep format distinct (Movie vs Series vs Episode).
- Wikidata: QID used to crosswalk registries and as authority when no OpenLibrary Work is available.

Normalization
- titleNorm: lowercase, diacritics removed, punctuation to spaces, collapse whitespace; strip common subtitle separators (":"/"–") to base form.
- creatorNorm: lowercase, diacritics removed, canonicalize "Lastname, Firstname" ↔ "Firstname Lastname", strip punctuation and initials dots.
- yearBucket: prefer first‑published year for books, release year for film/TV; otherwise nearest available year (optional, soft).

Grouping Strategy
1) Authority cluster key (best):
   - Books: OpenLibrary Work key, if present.
   - Else: Wikidata QID for Work, if present.
   - Film/TV: IMDb id for the title (never merged with book Work).
2) Fallback cluster key (only when no authority present):
   - (titleNorm + creatorNorm [+ yearBucket]) where creator is known.
   - If creator missing, titleNorm alone is not sufficient to auto‑merge; demote to low confidence.

Preferred Representative per Cluster
- Books: prefer OpenLibrary Work (image present > none), then Wikidata item with matching instance‑of (novel/book), then others.
- Film/TV: prefer OMDb (IMDb) with poster present, then Wikidata.
- General fallback: prefer entries with an image, then longest title (more informative), then first.

Confidence & Thresholds
- Authority match (same OL Work/QID/IMDb): confidence = 1.0 (high).
- Fallback match with creator: confidence based on simple similarity heuristic:
  - exact titleNorm + exact creatorNorm → 0.9
  - titleNorm equal and creatorNorm similar (≥ 0.8) → 0.7
  - titleNorm similar (≥ 0.9) and exact creatorNorm → 0.7
  - otherwise → 0.0 (no auto‑merge)
- Low confidence clusters (< 0.7) are not merged automatically; return as separate rows or prompt chooser when selected.

API Contract (New)
- Route: `GET /api/search/grouped?q=...&type=book|movie|series|episode|all&limit=20&expand=0|1`
- Response (200):
```
{
  "q": "the master and margarita",
  "items": [
    {
      "workId": null,
      "kind": "Book",
      "title": "The Master and Margarita",
      "creator": "Mikhail Bulgakov",
      "year": 1967,
      "imageUrl": "https://...",
      "authorities": [
        { "authority": "openlibrary_work", "extId": "/works/OL123W" },
        { "authority": "wikidata", "extId": "Q12345" }
      ],
      "confidence": 1.0,
      "hasMoreVersions": true,
      "versions": [
        { "source": "openlibrary", "sourceId": "/books/OL...M", "title": "Master i Margarita (RU)", "imageUrl": "...", "year": 1967, "lang": "ru" },
        { "source": "openlibrary", "sourceId": "/books/OL...M", "title": "The Master and Margarita (EN)", "imageUrl": "...", "year": 1967, "lang": "en" }
      ]
    }
  ]
}
```

Selection Semantics
- When the user selects a grouped row:
  - If confidence ≥ 0.7 or there is an authority ID present → resolve immediately to a Work via `/api/works/resolve` and persist `ExternalId` rows.
  - Else (low confidence) → present a chooser modal listing candidate clusters (by creator/year) before persisting.
- Slot writes always map to Work (`ListWork`). If a specific edition was chosen from versions, store that in display-only slot metadata, not as a separate Work.

Persistence Rules
- On selection, upsert Work:
  - Derive `kind` from source/type.
  - Set canonical `title`, `creator`, `year` (first published/release) if known.
  - Upsert `ExternalId(authority, extId)` for all known IDs for this cluster.
  - Attach `qid` if available, to enable future crosswalks.

Backfill & Growth
- Background job (optional): for any selected item missing an authority, attempt resolution later (e.g., edition → Work via OL Works) and attach the ID retroactively.
- Over time, the corpus of `ExternalId` becomes complete enough that future matches are deterministic and fast.

UI Notes
- Search rows show: title, creator, year, kind badge, and an image.
- A small “More versions” affordance appears on rows with editions/translations; clicking toggles an in‑place expansion list.
- Low confidence rows visually indicate ambiguity (e.g., “Verify author”) and trigger a chooser on select.

Validation
- The Master and Margarita:
  - One Book row with Bulgakov as creator; high confidence when OL Work or QID present.
  - Multiple editions/translations are hidden by default but available via “More versions”.
- Different formats (e.g., 2005 miniseries) appear separately as TVSeries/Movie clusters.

Rollout
- Add new grouped endpoint and types; keep existing endpoints stable.
- Migrate Create flow to call grouped endpoint and display Work rows once validated.
- Persist external IDs on selection; monitor confidence distribution; adjust thresholds.

