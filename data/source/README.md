# Archive data ownership

These files and `archive/txt/` are retained inputs. Commit changes to them with
regenerated exports. Never delete them as build output. No credentials or network
access are needed for assembly.

| Input | Owner and purpose |
| --- | --- |
| `archive/txt/*.txt` | Original historical text; parsed for show content. Preserve the original wording where possible. |
| `imported-playlists/*.json` | Full source records for shows without text. Initially six shows: 2013-06-22, 2013-06-29, 2013-07-06, 2013-07-13, 2013-08-10, 2014-02-01. New scraper imports go here. |
| `archived-dates.json` | Original archival date for each text source, keyed by show date. Add an explicit date when introducing a new text source. Imported records carry their own archival date. Rebuilding never changes these dates. |
| `corrections.json` | Ordered, reviewed editorial changes applied after parsing/importing. An empty list means no separate corrections have been recorded. |
| `spotify-overrides.json` | Reviewed Spotify mappings keyed by `Artist\|Song`; these take precedence over the retained index. Initially empty: the migrated index had no entries marked manual. |
| `metadata/artist-bios.json` | Retained enrichment snapshot: Last.fm bios/statistics/raw tags plus Spotify images/IDs and previously consolidated tags. |
| `metadata/spotify-index.json` | Retained API search results, including genres and confidence. Existing results survive failed refreshes. |

The two metadata snapshots were copied from the existing public files without
changing their contents. They are valuable retained inputs, not reproducible API
caches. Keep them in version control. Current source records reproduce 125 shows,
1,448 track appearances and the complete existing enrichment payloads.

## Rebuild and verify

From anywhere, invoke the repository's `update-playlists.sh` (Python 3, standard
library only). From the repository root:

```bash
./update-playlists.sh
python3 -m unittest discover -s scripts/tests -v
node --test scripts/tests/source-data.test.cjs
```

For a clean rebuild without touching the checkout exports:

```bash
python3 scripts/parsing/parse_playlists.py --output-root /tmp/cyprus-clean
python3 scripts/parsing/validate_playlists.py --output-root /tmp/cyprus-clean
```

Use `--root /path/to/repository` to assemble a separate set of inputs. A second
unchanged build produces identical bytes. No generation timestamp is placed in
archive records. The Python tests compare clean outputs with the checked-in
archive, including every imported show, archival date, track and metadata entry.

Generated outputs are `json/individual/*.json`, `json/playlists.json`, and
`web/public/{playlists,artist-bios,spotify-index}.json`. Edit inputs instead of
these exports. All inputs are assembled and validated before publication; all
replacement files are staged before any export changes, then each file is
atomically replaced. Invalid input leaves existing exports untouched. Replacements
are atomic per file, not a transaction across the entire tree: after a machine or
filesystem failure during publication, rerun the build and validator.

Stale individual exports are removed only after successful assembly/publication.
Removing a text source intentionally removes that show on the next successful
build; leftover output can no longer restore it. Removing a show permanently
requires reviewing its source, archival-date entry, corrections and mappings.
Continue tracking generated files for now; changing ignore policy is a later step.

## Editorial corrections and approved Spotify matches

To correct every exact appearance of an artist/song pair:

```json
[
  {
    "from": { "artist": "Original artist", "song": "Original title" },
    "to": { "artist": "Reviewed artist", "song": "Reviewed title" }
  }
]
```

Add `"date": "YYYY-MM-DD"` to restrict a correction to a single show. Corrections
are applied in list order; each must match at least one source track or the build
fails for review. This prevents silently losing corrections after source edits.
Do not duplicate a correction by also making the same edit in the text source.

Run `node scripts/spotify/recover-missing-tracks.js` for interactive review. Each
approved mapping is saved to `spotify-overrides.json`; approved spelling changes
are saved to `corrections.json`. The tool rebuilds all exports after each approval,
so quitting retains reviewed work. Mapping keys use the same single `|` separator
as the web app, indexer and MCP. Spelling changes retain mappings under both the
original and corrected keys. A mapping uses the index schema (`spotifyUrl`,
`spotifyId`, `artistName`, `trackName`, `confidence`, `manual`).

## Refresh enrichment separately

```bash
node scripts/lastfm/fetch-artist-bios.js --missing-only  # default
node scripts/lastfm/fetch-artist-bios.js --refresh       # explicitly revisit all current artists
node scripts/spotify/enrich-artist-images.js
node scripts/spotify/index-spotify-tracks.js --missing-only
node scripts/consolidate-genres.js
```

These commands require their existing provider credentials. They update retained
snapshots, then run offline assembly. Last.fm owns `bio`, `bioSummary`, `url`,
`listeners`, `playcount`, and `lastfmTags`. It retains prior successful values on
request failure or empty text, preserves artists outside the current archive, and
keeps Spotify fields and consolidated display `tags`/`tagSources`. For a new,
unconsolidated entry it also initializes display tags and a missing image.
Rerun consolidation explicitly when refreshed raw tags should change display tags.
Spotify image enrichment owns the existing Spotify fields and image. Tag
consolidation owns display `tags` and `tagSources`; it still needs network access.

`data/{discovered_playlists,gap_analysis,spotify-not-found}.json` and recovery
reports are operational reports, not archive inputs. The scraper saves new records
in `imported-playlists/` and rebuilds; it refuses to overwrite an existing source.
Discovery reports may be regenerated independently.

Optional parser container, with the whole repository mounted for declared inputs:

```bash
docker build -f docker/Dockerfile.parse -t cyprus-avenue-parser .
docker run --rm -v "$PWD:/app" cyprus-avenue-parser
docker run --rm -v "$PWD:/app" cyprus-avenue-parser python scripts/parsing/validate_playlists.py
```

Local Python is the supported default. Container execution has not been verified
as part of this source migration.
