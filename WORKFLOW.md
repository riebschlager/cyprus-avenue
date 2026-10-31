# Maintaining the Cyprus Avenue archive

The archive has three independent parts: a static Vue browser in `web/`, maintenance
scripts in `scripts/`, and an optional MCP server in `mcp/`. Maintenance commands
update declared sources and regenerate exports; they do not run a web backend.
Read [the source contract](data/source/README.md) before editing archive data.

## Setup

Use Node 22.16+ and Python 3.11+. Offline assembly uses Python's standard library;
root npm commands have no package dependencies. Web and MCP dependencies stay in
their own directories (`npm --prefix web ci`, `npm --prefix mcp ci`).

Only KCUR discovery/fetching needs Python packages:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

Use local Python and Node. Docker launch modes and Dockerfiles have been removed.

## Commands

Run these from the repository root, or use `npm --prefix /path/to/cyprus-avenue run ...`.
Direct script paths and the shell launchers work from any working directory.

| Command | Purpose | Network/credentials |
| --- | --- | --- |
| `npm run data:build` | Assemble and validate every export | Offline; none |
| `npm run data:validate` | Compare exports with declared sources | Offline; none |
| `npm run data:tags` | Consolidate retained tags and rebuild exports | Offline; none |
| `npm run discover` | Find KCUR playlists and write gap reports | KCUR; none |
| `npm run fetch:playlists` | Import missing shows from gap report | KCUR; none |
| `npm run refresh:spotify -- --missing-only` | Match unindexed tracks | Spotify |
| `npm run recover:spotify` | Interactively approve missing matches/corrections | Spotify |
| `npm run refresh:bios` | Fetch missing biographies | Last.fm |
| `npm run refresh:bios -- --refresh` | Revisit all current artists | Last.fm |
| `npm run refresh:images` | Fill missing artist images | Spotify |
| `npm run refresh:genres` | Persist Spotify artist genres | Spotify |
| `npm test` | Archive, browser, and MCP regression checks | Offline; none |
| `npm run build:web` | Build browser independently | Installed web dependencies |
| `npm run build:mcp` | Build MCP independently | Installed MCP dependencies |

`./update-playlists.sh`, `./discover.sh`, and `./index-spotify.sh` remain aliases.
The Spotify indexer without `--missing-only` revisits all non-overridden tracks.
Refresh commands run immediately; there is no extra shell confirmation prompt.

## Edit and rebuild

Edit original text in `archive/txt/`, imported shows in
`data/source/imported-playlists/`, or reviewed corrections in
`data/source/corrections.json`. Add an archival date in
`data/source/archived-dates.json` for a new text source. Then run:

```bash
npm run data:build
npm test
```

For a separate input tree or clean output directory:

```bash
./update-playlists.sh --root /path/to/inputs --output-root /tmp/cyprus-clean
```

The parser and validator also accept these arguments directly. Never use existing
exports as replacement source inputs. Commit source edits and regenerated exports
together. Validation failures produce a nonzero status and identify the mismatch.

## Credentials and requests

Copy `.env.example` to `.env` in the repository root and fill in the provider keys.
All Node maintenance scripts use the same loader, resolved relative to the
repository, regardless of the current directory. Node's built-in dotenv parser
handles quoted values, whitespace, comments, and `export` prefixes; values already
in the process environment take precedence. Shell code in values is never executed.
The browser's Spotify OAuth configuration is separate; never expose a client secret
in web environment variables.

The shared maintenance client uses a 30-second timeout per request, including body
reads. Network failures, HTTP 429 and 5xx responses receive at most three retries.
Backoff is bounded at 60 seconds; `Retry-After` seconds or HTTP dates are respected.
A longer requested wait stops the request instead of retrying early. Spotify tokens
are shared within each process, refreshed before expiry, and refreshed once on 401.
Errors omit response bodies and URLs containing credentials.

Refreshes retain prior successes and fields owned by other providers. Successful
results are saved through atomic JSON replacement and exports are rebuilt. Partial
request failures produce a nonzero exit status after saving successes. Missing
Spotify search matches remain coverage gaps rather than transport failures.

## Tags and retained inputs

Run `npm run refresh:genres` when online to save raw `spotifyGenres` on artist
records. Then run `npm run data:tags` offline to merge Last.fm `lastfmTags`, saved
artist genres, and indexed track genres. A successful empty genre list replaces the
old list; failed requests preserve it. Refreshing genres alone does not change
display tags.

Historical snapshots contain combined tags without separate Spotify artist lists.
Until a successful refresh supplies those lists, consolidation retains the existing
combined tags and their historical Spotify source count. It does not infer provider
provenance from tag names. Case/whitespace deduplication preserves the first label;
Last.fm labels have priority. Assembly alone preserves the retained metadata as-is.

## MCP launch

Configure an MCP client to execute the absolute path to `mcp-server.sh` with no
arguments. The launcher installs locked dependencies if absent and compiles on
every launch before starting Node, so source edits cannot leave stale compiled
code. Installation/build messages go to stderr to preserve the stdio protocol.

## Regression baseline

After installing application dependencies with `npm --prefix web ci` and
`npm --prefix mcp ci`, run `npm test` from the root. It runs maintenance/parser
checks, browser utility and mocked Spotify checks in both UTC and America/Chicago,
and a built MCP server smoke test over stdio. No provider credentials or live API
requests are needed. Run `npm run build:web` to check TypeScript and the production
bundle. Pull requests run all these checks in `.github/workflows/validate.yml`.

For focused work, use `npm run test:maintenance`, `npm run test:web`, or
`npm run test:mcp`. Archive checks rebuild into temporary directories and verify
complete record parity, all six imported shows, reviewed corrections, retained
metadata, deterministic bytes, parser formats, and invalid-input failures. Keep
new tests focused on preservation, links, or integration behavior.

`npm run data:validate` compares every export against declared sources and exits
nonzero on invalid schema, dates, missing records, or content drift. Its biography
and Spotify coverage counts are informational; missing enrichment does not make
an otherwise valid archive fail. Spotify coverage uses unique exact artist/song
pairs in the current archive and counts high/medium matches only.
