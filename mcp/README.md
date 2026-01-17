# Cyprus Avenue MCP Server

MCP (Model Context Protocol) server for LLM-powered music exploration and discovery through the Cyprus Avenue radio archive.

## Features

- **21 tools** for querying playlists, artists, tracks, and generating documents
- **Artist connections** - discover who played alongside whom
- **Mood/era suggestions** - natural language queries like "soulful" or "60s"
- **Curation analysis** - understand Bill Shapiro's playlist patterns
- **Artifact generation** - create shareable Markdown + JSON documents

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run server
npm start
```

## Usage with Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "cyprus-avenue": {
      "command": "/path/to/cyprus-avenue/mcp-server.sh"
    }
  }
}
```

Or with Docker:

```json
{
  "mcpServers": {
    "cyprus-avenue": {
      "command": "/path/to/cyprus-avenue/mcp-server.sh",
      "args": ["--docker"]
    }
  }
}
```

## Available Tools

### Core Query Tools (6)
| Tool | Description |
|------|-------------|
| `search_playlists` | Search by date, title, description |
| `get_playlist` | Get full playlist with tracks |
| `search_artists` | Search by name, bio, tags |
| `get_artist` | Detailed artist profile |
| `search_tracks` | Search by artist, song, genre |
| `get_track` | Track details with Spotify data |

### Discovery Tools (6)
| Tool | Description |
|------|-------------|
| `discover_by_tag` | Find artists/tracks by genre |
| `this_week_in_history` | Historical playlists |
| `similar_artists` | Tag-based similarity |
| `random_discovery` | Serendipitous exploration |
| `find_artist_connections` | Who played together |
| `suggest_by_mood_or_era` | Natural language suggestions |

### Curation Analysis (5)
| Tool | Description |
|------|-------------|
| `get_statistics` | Archive overview |
| `analyze_top_artists` | Most featured artists |
| `analyze_genre_trends` | Genre evolution |
| `analyze_themes` | Thematic patterns |
| `get_curation_summary` | Full curation analysis |

### Artifact Generation (4)
| Tool | Description |
|------|-------------|
| `generate_playlist_document` | Shareable playlist |
| `generate_artist_profile` | Artist research document |
| `generate_discovery_report` | Themed discovery |
| `generate_year_in_review` | Annual summary |

## Example Queries

- "I like Bob Dylan, who else should I listen to?" → `find_artist_connections`
- "What were Bill Shapiro's favorite artists?" → `analyze_top_artists`
- "I want something soulful" → `suggest_by_mood_or_era`
- "Create a document about blues in the archive" → `generate_discovery_report`

## Data Sources

The server loads data from:
- `json/playlists.json` - 125 playlists
- `web/public/artist-bios.json` - 277 artist profiles
- `web/public/spotify-index.json` - 1,033 Spotify track links

## Architecture

```
mcp/
├── src/
│   ├── index.ts          # Server entry point
│   ├── tools/
│   │   ├── search.ts     # Query tools
│   │   ├── discovery.ts  # Discovery tools
│   │   ├── analysis.ts   # Analysis tools
│   │   └── artifacts.ts  # Artifact generation
│   ├── data/
│   │   ├── loader.ts     # Data loading & indexing
│   │   └── tagMappings.ts # Mood/era mappings
│   └── utils/
│       ├── similarity.ts # Scoring algorithms
│       ├── fuzzyMatch.ts # Name matching
│       └── formatters.ts # Output formatting
├── package.json
└── tsconfig.json
```

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build
```
