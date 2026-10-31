# Cyprus Avenue cleanup recommendations

Reviewed October 31, 2026. This is a repository review and proposed plan; no application code or archive records were changed.

## Recommendation

Keep the static Vue application and simplify the systems around it. The frontend has just two runtime dependencies, Vue and Vue Router, and its production build passes. The main maintenance costs come from unclear data ownership, repeated integration code, optional features mixed into core browsing, and documentation that describes different versions of the project.

I recommend an incremental cleanup: protect the archive first, repair the maintenance workflow, remove verified leftovers, then refactor the frontend. A framework rewrite, database, backend service, or elaborate monorepo toolchain would add work without solving the problems observed here.

## What the project actually contains

There are three independently useful systems:

1. **Archive browser:** `web/` is a Vue 3/TypeScript/Vite SPA deployed to GitHub Pages. It browses shows, artists, and tracks; supports search, downloads, share links, and keyboard navigation; and optionally authenticates with Spotify for playback and playlist creation.
2. **Archive maintenance:** Python scripts parse historical text and discover/fetch KCUR pages. Node scripts match Spotify tracks, recover matches manually, fetch Last.fm biographies, enrich artist images, and consolidate tags. These run during maintenance, rather than as a web backend.
3. **MCP interface:** `mcp/` exposes 21 query, discovery, analysis, and document-generation tools over the same archive. The website does not require it.

The current data flow is:

```text
archive/txt/ (119 shows) ── parser ──┐
                                   ├── json/individual/ (125 shows)
6 JSON-only shows ─────────────────┘            │
                                               └── json/playlists.json
                                                        │
                                                        └── web/public/playlists.json

Spotify + Last.fm scripts ── web/public/{spotify-index,artist-bios}.json

Web reads web/public/. MCP reads json/playlists.json and web/public/ metadata.
```

Measured inventory:

| Item | Current checkout |
| --- | --- |
| Playlists | 125 |
| Track appearances, including repeats across shows | 1,448 |
| Unique exact artist/song pairs | 1,211 |
| Unique exact artist names | 304 |
| Artist biography entries | 277 |
| Spotify index entries | 1,033: 968 high confidence, 65 medium confidence |
| Public JSON payloads | Approximately 2.08 MB combined, before compression |

The README's 1,506-track figure is stale. Biography coverage and unique artist count are different measures and should be labeled separately. Spotify coverage should be calculated against current archive keys with a stated denominator, rather than inferred from index size.

## 1. Establish data ownership before deleting generated files

**Priority: highest.** The distinction between source and output is currently misleading.

`GEMINI.md` calls `archive/txt/` the source of truth, but these six shows have no text source:

- `2013-06-22`
- `2013-06-29`
- `2013-07-06`
- `2013-07-13`
- `2013-08-10`
- `2014-02-01`

The parser deliberately preserves these existing JSON files. Consequently, deleting `json/individual/` as disposable output would lose archive content. Removing a text source also does not necessarily remove its show, because its old JSON can be preserved.

**Recommended model:** keep the original text as preservation material, explicitly store the six JSON-only records as source inputs, and store editorial corrections and manually approved Spotify mappings separately from generated exports. Continue supporting text parsing; there is no need to normalize all 119 historical source files immediately.

For example, introduce `data/source/imported-playlists/` for JSON-only records, `data/source/corrections.json` for reviewed corrections, and `data/source/spotify-overrides.json` for manual matches. Define which current metadata snapshots are retained inputs. Generate the consolidated dataset and web copies from these explicit inputs, without depending on leftover files from a previous run.

Specific repairs:

- `scripts/spotify/recover-missing-tracks.js` can apply corrections only to `json/playlists.json`. It does not update individual records, raw text, or the public copy. A subsequent parse can erase those corrections. Persist them as source corrections and rebuild all exports together.
- `scripts/lastfm/fetch-artist-bios.js` starts with an empty `bios` object and replaces `web/public/artist-bios.json`. A refresh can discard Spotify fields, consolidated tags, and entries whose requests failed. Merge only fields owned by Last.fm, retain previous successful values on failure, and make missing-only versus full refresh explicit.
- `parse_playlists.py` sets `archived_date` to the current date on every parse. Preserve the original archival date; record generation time separately if needed.
- Use stable ordering, validate before publishing, and write replacements through temporary files. Do not overwrite good exports after a partially failed run.

Keep the enrichment snapshots in version control initially: they contain useful results and are not reliably reproducible offline. Decide whether to ignore other generated files only after a clean rebuild is proven to preserve every show and manual correction.

**Completion criterion:** a clean build from declared inputs recreates all 125 shows and retained metadata; a second unchanged build produces no content diff.

## 2. Make maintenance commands consistent and trustworthy

**Priority: high.** Keep Python for the existing parser/scrapers and Node for API scripts. Unify their entry points and shared plumbing rather than rewriting them into one language.

- Add a small root command interface, such as npm scripts plus a Python dependency file. Keep `web/` and `mcp/` independently buildable. npm workspaces are optional; they are not a prerequisite for cleanup.
- Give the parser explicit input/output arguments. It currently assumes a Docker-provided `txt/` directory, whereas the repository stores text under `archive/txt/`.
- Resolve paths from the script/repository location. Several scripts depend on the caller's working directory; others use `__dirname` or search only one parent for `.env`.
- Standardize Node module format explicitly. The scripts currently mix `require` and `import` without a root package declaration. Adding `"type": "module"` alone would break the CommonJS scripts, so migrate those scripts or use explicit extensions first.
- Replace repeated `.env` parsers with one documented loader. Remove `export $(cat .env | ... | xargs)` from `index-spotify.sh`; it mishandles quoted values and whitespace.
- Extract shared Spotify client-credentials handling, JSON reads/writes, request timeouts, bounded retries, and rate-limit handling. Existing retry handling is uneven. Keep this maintenance client separate from browser OAuth, since their credentials and lifecycles differ.
- Separate network refresh from offline data assembly. `consolidate-genres.js` currently needs credentials and fetches artist genres while assembling tags. Persist fetched inputs, then allow tag consolidation without network access.

### Reduce Docker's role

The parser uses Python's standard library. Requiring a Docker image build for every playlist edit adds unnecessary friction. Make a local Python invocation the default; document a virtual environment and pinned scraper dependencies. Keep Docker as an optional supported path if it is actually useful.

There is also a concrete configuration conflict: `.dockerignore` excludes `json/`, but `docker/Dockerfile.mcp` tries to `COPY json/playlists.json`. The MCP launcher also builds only when `mcp/dist/` is absent, so existing compiled code can become stale.

If retaining container support, fix the build context, build TypeScript within a reproducible image or explicit build step, and test that image. Otherwise remove the MCP Docker path and its launcher branches together. Do not preserve multiple unverified execution modes solely because they already exist.

## 3. Repair validation and add a small regression baseline

**Priority: high.** The existing validator is useful, but its success message is stronger than its guarantees.

In `scripts/parsing/validate_playlists.py`:

- The entry point ignores the returned success boolean, so reported validation failures do not set a failing process exit status.
- The no-files path returns a nonempty tuple instead of the usual boolean.
- Consolidated validation compares counts, not record contents. It does not compare the public export.

Make the validator fail the command on invalid input, check schema and actual dates, compare complete records across exports, and verify that all declared source records survive generation. Treat missing biographies and Spotify matches as coverage reports rather than automatically invalid archive data.

Add focused tests for behavior most likely to lose data or break links:

1. Representative parser formats, plus preservation of all six imported records and reviewed corrections.
2. Export parity and deterministic rebuilds, with network calls disabled.
3. Date formatting and slug generation in UTC and America/Chicago.
4. Tag normalization and matching consistency between web and MCP, if MCP remains supported.
5. Spotify index readiness, expired-token refresh, partial batch failure, and restoration of a pending action after OAuth, using mocks.

Add pull-request CI for these checks and the web build. Build and smoke-test MCP if it remains a supported deliverable. The current workflow deploys pushes to `master` and manual runs; it provides no pull-request validation job.

Avoid broad snapshot suites or tests that only restate simple rendering code.

## 4. Fix routing and async state before rearranging components

**Priority: high to medium.** These are concrete correctness issues, not merely stylistic preferences.

### Dates and share URLs

`web/src/utils/slug.ts` parses `YYYY-MM-DD` with `new Date(date)` and then uses local calendar getters. In America/Chicago, `2015-01-03` becomes January 2. That changes playlist slugs by timezone. Similar parsing occurs in card/table dates and “this week” logic.

Introduce one date-only helper and derive slugs from stable archive dates. Preserve existing links through aliases or a fallback resolver when changing URL generation.

`useOpenGraph.ts` builds playlist URLs from `playlist.slug`, but the archive `Playlist` type and records have no such field. `ArtistsViewWrapper.vue` checks `artist.appearances`, while `useArtists.ts` exposes `tracks`. Both slip through `any`-typed lookup helpers. Route metadata updates also watch slugs separately from asynchronously loaded data, and multiple `useOpenGraph()` calls install competing route watchers.

Use typed lookup helpers, one URL-generation policy, and a single metadata owner that reacts to both route and resolved record. Preserve the existing GitHub Pages base-path and `404.html` fallback behavior. If route-specific social previews matter later, evaluate prerendering separately after the client metadata is correct.

### Loading and derived state

The three JSON loaders use different concurrency behavior. `usePlaylists.ts` shares a promise; `useArtistBios.ts` polls a loading flag; `useStreamingLinks.ts` starts loading as a side effect and returns early to concurrent callers. Playlist creation can therefore see an empty Spotify index before loading completes.

Give each dataset an awaitable, shared load promise and explicit loading/error state. Keep separate loaders so basic browsing does not require all enrichment data. Make index-dependent operations await readiness.

`components/ArtistsView.vue` calls `useArtists(props.playlists)`, while the route wrapper passes the reactive ref. Use a getter for the prop so replacements after async loading remain reactive. Consolidate duplicated artist derivation where practical.

Module-level Vue state is sufficient for this small application. A new state-management dependency is not necessary to solve these problems.

## 5. Contain Spotify complexity

**Priority: medium, with correctness fixes early if these features stay.** Browsing and external streaming links should remain usable independently of Spotify authentication.

Retain playlist creation and playback if they are valued features, but group their components, composables, types, and transport code under one feature boundary. If either is rarely used, removing the whole feature is a more meaningful simplification than trimming individual helper files. Make that a product decision, not an assumption during cleanup.

For retained functionality:

- Replace the four repeated creation workflows in `useSpotifyPlaylistCreation.ts` with track-selection functions and one creation runner. Preserve each mode's current deduplication and API-search policy explicitly.
- Obtain fresh tokens through a shared authenticated request function. Playlist creation currently captures `getAccessToken()` once, while playback uses `getValidAccessToken()`. Deduplicate concurrent refresh requests.
- Replace `Math.random()` in OAuth verifier/state generation with cryptographically secure randomness.
- Use one typed pending-action format for playback, individual-show, archive, artist, and tag actions. Give one owner responsibility for consuming it once.
- Check playback HTTP responses, expose actionable errors, disconnect/reset the SDK player on logout, and make failed SDK loading retryable.
- Configure client ID, redirect URL, and site URL consistently. The current hardcoded client-ID fallback masks missing configuration, and the production callback remains fixed even when the Vite base path changes. A client ID is public configuration; keep the client secret limited to maintenance scripts.

## 6. Remove verified leftovers and reduce frontend repetition

**Priority: medium to low.** There is no evidence of a bloated runtime dependency list. Most cleanup value is in source organization and repeated behavior.

| Candidate | Recommended treatment |
| --- | --- |
| `web/public/vite.svg`, `web/src/assets/vue.svg` | Remove after a final reference check; no source references were found. |
| `web/src/assets/cyprus-avenue.jpg` | Remove the unreferenced duplicate; it is byte-identical to the public image used by sharing metadata. |
| `web/tailwind.config.js` | Verify removal with a production build and visual check. It contains only default settings; the current CSS imports Tailwind and has no `@config` reference. |
| `autoprefixer` / PostCSS setup | Evaluate after inspecting installed Tailwind behavior; do not delete working build dependencies by name alone. |
| `CLAUDE.md` | Extract any useful current instructions, then move historical narrative out of the root or remove it. It is roughly 42 KB of development history. |
| `GEMINI.md`, `QUICKSTART.md`, overlapping READMEs | Consolidate current guidance into a short README and one maintenance guide; retain MCP-specific setup beside MCP if supported. |
| `data/gap_analysis.json`, `data/discovered_playlists.json` | Treat as dated discovery reports. Archive or regenerate on demand once their consumers are accounted for. |
| `data/spotify-not-found.json` | Keep while recovery depends on it; make it a derived coverage report once canonical mappings and overrides exist. |
| `archive/txt/`, six JSON-only records, enrichment JSON | Preserve until the source migration and rebuild checks are complete. |

Fix the unresolved `@/assets/chevron-down.svg` reference in `ArtistsView.vue`: the production build warns about it, and Vite defines no `@` alias. Use the same relative asset strategy already working elsewhere.

For component organization, move route pages into `views/` consistently and remove wrapper components that only duplicate loading/error presentation. Split `HomePage.vue` (681 lines) around its actual sections and extract repeated pagination, download-menu, and navigation behavior where that reduces duplication. Keep the actively used keyboard-navigation and dropdown helpers; their existence is not evidence of cruft.

Use one navigation definition for desktop and mobile, shared classes instead of repeated inline style objects, and stable record keys rather than expanded array indexes where filtering or pagination can change ordering. Keep accessibility behavior intact during these edits.

Centralize tag normalization and the archive data contract. The browser currently filters/maps raw tags, while MCP mostly lowercases them; consolidation applies yet another normalization. This can produce different discovery results from the same metadata. Share a small pure module or publish normalized tags during offline assembly. Preserve raw provider tags for provenance.

Replace `any` at the boundaries implicated above, including slug lookups, modal context, API responses, and track matches. Validate external JSON at ingestion. For biographies rendered through `v-html`, either publish plain text with an explicit attribution link or sanitize permitted markup during ingestion.

### Item 6 implementation — October 31, 2026

- Removed the verified starter assets, duplicate image, unused HTML-link icon,
  default Tailwind config, and separate Autoprefixer dependency/pass. PostCSS stays
  for Tailwind 4; inspected Lightning CSS prefixing and compared generated CSS.
- Consolidated current root guidance into README and WORKFLOW, kept web/MCP setup
  beside their applications, and moved the historical narrative to
  `docs/history/development.md`. Removed redundant GEMINI/QUICKSTART guides.
- Kept discovery/gap snapshots because the importer still consumes the gap report;
  documented regeneration. Spotify recovery reports and all archive/source metadata
  remain retained.
- Moved archive route pages into `views/`, removed loading-only wrappers, and shared
  loading/error presentation, pagination logic/controls, and download menus. Split
  home discovery, project background, and export sections into components.
- Desktop/mobile navigation uses one definition and shared classes. Artist expansion
  follows names; track rows use original show/position identity. Kept keyboard and
  dropdown helpers, added native Enter handling and Escape/outside menu dismissal.
- Browser and MCP share archive types and runtime JSON validation. MCP normalizes
  in-memory discovery tags with the existing shared browser policy; source provider
  tags remain unchanged. Browser biographies render plain text with Last.fm links.
- Verified production builds, offline archive/browser/MCP tests, and desktop/mobile
  browsing, filtering, deep links, pagination, keyboard shortcuts, and downloads.
  Live Spotify authentication/playback was not exercised for this cleanup.

## Proposed execution order

| Pass | Scope | Done when |
| --- | --- | --- |
| 1: Protect the archive | Explicit imported sources, corrections/overrides, validator exit status, baseline fixtures | All 125 shows survive a clean rebuild and invalid input fails checks. |
| 2: Repair workflows | Field-preserving enrichment, offline assembly, script paths/config, chosen Docker policy | One documented command assembles data without credentials; refreshes preserve unrelated metadata. |
| 3: Fix observable bugs | Date/slugs with compatibility, metadata, awaitable loaders, reactive artist input, asset warning | Direct links work consistently across timezones and cold loads; production build has no unresolved assets. |
| 4: Remove clutter | Starter assets, redundant docs/config, unused execution paths after verification | A newcomer can identify sources, run the app, and maintain data from concise instructions. |
| 5: Refactor retained features | Spotify runner/client, route/component boundaries, shared tags/types | Existing browsing and retained Spotify behavior pass focused checks with less repeated code. |

Prefer several reviewable changes over a directory-wide move. Stabilize behavior and ownership before changing paths. Update documentation as commands and contracts change, rather than keeping obsolete guides beside new ones.

## Verification performed and limits

- Ran `npm run build` in `web/` using installed dependencies: TypeScript and Vite passed. Observed the unresolved chevron asset warning, an outdated Browserslist dataset notice, and a Node deprecation notice. The local runtime was Node 24; deployment specifies Node 22.
- Ran the existing Python validator: it reported 125 shows, 1,448 tracks, and no issues under its current checks.
- Independently compared individual, consolidated, and public playlist records: all agree in this checkout.
- Parsed all 119 text sources in memory: their content matches current individual JSON when excluding the changing `archived_date`. Adding the six JSON-only records yields the same 1,448 track appearances. No archive files were regenerated.
- Confirmed the duplicate image is byte-identical and reproduced the January 3 → January 2 local-date conversion in America/Chicago.
- Reviewed source, configuration, scripts, documentation, and deployment workflow. No test/spec files were found in the repository source inventory.
- Did not run live Spotify/Last.fm/KCUR requests, mutate a Spotify account, exercise the UI interactively, build Docker images, or build MCP (its dependencies are absent). Those behaviors need targeted verification during implementation; static findings above are identified by their source paths.
