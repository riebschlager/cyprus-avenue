# Cyprus Avenue Playlist Archive

A static archive of Bill Shapiro’s KCUR radio show: 125 playlists, 1,448 track
appearances, and 304 artists, spanning December 2009–July 2017. Biographies cover
277 artists. Browse shows, search tracks, discover artists by tag, and download
the archive. Optional Spotify integration supports playback and playlist creation.

[Browse the archive](https://cyprus-avenue.the816.com/).

## Run locally

Use Node 22.16+ and Python 3.11+.

```bash
npm --prefix web ci
npm --prefix web run dev
```

Open the local URL printed by Vite. Browsing needs no credentials. See
[web setup](web/README.md) for Spotify configuration and deployment.

## Project layout

| Location | Purpose |
| --- | --- |
| `archive/txt/` | Original historical text; retained preservation material |
| `data/source/` | Imported JSON-only shows, archival dates, corrections, Spotify overrides, retained metadata |
| `json/` | Generated individual and consolidated playlist exports |
| `web/` | Vue 3 / TypeScript / Vite / Tailwind 4 browser and public exports |
| `scripts/` | Python parsing/discovery and Node enrichment tools |
| `shared/` | Browser/MCP archive contract, JSON validation, and tag normalization |
| `mcp/` | Independently buildable MCP archive interface |

## Maintain and verify

Read the [source ownership contract](data/source/README.md) before editing data,
and the [maintenance guide](WORKFLOW.md) for commands, credentials, and refresh rules.

```bash
npm run data:build       # Offline assembly and validation; no npm dependencies
npm --prefix mcp ci      # Needed for the full regression suite
npm test                # Offline maintenance, browser, and MCP checks
npm run build:web       # TypeScript and production bundle
```

Commit source edits and regenerated exports together. Keep historical text,
JSON-only source records, and enrichment snapshots; exports are never fallback
inputs. Discovery reports remain inputs to the missing-show importer and Spotify
recovery reports remain in use; see the maintenance guide before removing them.

[Cleanup review](CLEANUP_RECOMMENDATIONS.md) records the original recommendations.
[Development history](docs/history/development.md) is historical context.

## Sources and license

Original playlists and radio program: [KCUR Cyprus Avenue](https://www.kcur.org/show/cyprus-avenue).
Created for preservation and educational use. Original content is © KCUR Kansas
City Public Radio; track listings and metadata are provided as-is for archival use.
