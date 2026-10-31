# Cyprus Avenue Playlist Archive

A comprehensive archive of playlists from KCUR's legendary **Cyprus Avenue** radio show, hosted by Bill Shapiro for over 40 years (1978-2018). Includes a modern web application for browsing playlists, artists, and tracks with integrated Spotify playback.

## About Cyprus Avenue

Cyprus Avenue was a Saturday night institution on KCUR 89.3 FM in Kansas City, featuring "the world of popular music from gospel to rock - from country to reggae - from a different point of view." Bill Shapiro, a Kansas City tax attorney by day and music enthusiast by night, curated unique playlists introducing listeners to both classic and contemporary artists across all genres. He passed away in January 2020 at age 82.

## 🌐 Web Application

The archive includes a full-featured Vue 3 web application:

**Live Demo**: [riebschlager.github.io/cyprus-avenue](https://riebschlager.github.io/cyprus-avenue)

### Features

- **Browse Playlists** - View all 125 shows with expandable track lists
- **Artist Discovery** - Explore 277+ artists with bios, images, and tag filtering
- **Track Search** - Search across all 1,506 tracks instantly
- **Spotify Integration**:
  - 🎧 **Web Player** - Listen to tracks directly in the browser
  - 📋 **Playlist Creation** - Create Spotify playlists with one click
  - Four playlist modes: individual shows, complete archive, by artist, by tag
- **Multi-Platform Streaming** - Links to Spotify, Apple Music, and YouTube Music
- **"This Week in History"** - See what Bill Shapiro played on this date
- **Artist Metadata** - Bios and tags from Last.fm, images from Spotify

### Run Locally

```bash
cd web
npm install
npm run dev
# Open http://localhost:5173
```

## Archive Contents

This archive preserves **125 Cyprus Avenue playlists** spanning nearly 8 years:

- **Total Playlists**: 125
- **Total Tracks**: 1,506
- **Unique Artists**: 277+
- **Date Range**: December 12, 2009 to July 14, 2017
- **Spotify Coverage**: 89.9% of tracks found on Spotify

## Data Format

All playlists are available in structured JSON format:

### Individual Playlists
Each episode has its own JSON file in [`json/individual/`](json/individual/):
```json
{
  "date": "2015-01-03",
  "title": "2014 Favorites",
  "description": "As we look forward to what 2015 will bring...",
  "tracks": [
    {
      "artist": "Rosanne Cash",
      "song": "A Feather's Not A Bird"
    }
  ],
  "source_url": "https://www.kcur.org/tags/cyprus-avenue",
  "archived_date": "2025-12-31"
}
```

### Consolidated Data
All playlists are also available in a single file: [`json/playlists.json`](json/playlists.json)

## Using the Data

### Quick Start - Python
```python
import json

# Load all playlists
with open('json/playlists.json', 'r') as f:
    playlists = json.load(f)

# Find all Bob Dylan songs
dylan_songs = []
for playlist in playlists:
    for track in playlist['tracks']:
        if 'Dylan' in track['artist']:
            dylan_songs.append(track)

print(f"Found {len(dylan_songs)} Dylan tracks")
```

### Quick Start - JavaScript
```javascript
const playlists = require('./json/playlists.json');

// Get all unique artists
const artists = new Set();
playlists.forEach(playlist => {
  playlist.tracks.forEach(track => {
    artists.add(track.artist);
  });
});

console.log(`${artists.size} unique artists`);
```

## Example Queries

- **Search by artist**: Find all tracks by a specific artist
- **Search by date**: Get playlists from a specific time period
- **Genre analysis**: Identify most-played artists or songs
- **Playlist recreation**: Use the data to create Spotify/Apple Music playlists

## Repository Structure

```
cyprus-avenue/
├── web/                     # Vue 3 web application
│   ├── src/
│   │   ├── components/      # 17 Vue components
│   │   ├── composables/     # 12 reusable composables
│   │   ├── views/           # Route views
│   │   └── utils/           # Utility functions
│   └── public/
│       ├── playlists.json   # Playlist data for web app
│       ├── spotify-index.json    # Spotify track mappings
│       └── artist-bios.json # Artist metadata (Last.fm + Spotify)
├── json/
│   ├── individual/          # 125 individual playlist JSON files
│   └── playlists.json       # Consolidated file with all playlists
├── archive/
│   └── txt/                 # Original copy/pasted text files
├── scripts/
│   ├── parsing/             # Parser tools
│   │   ├── parse_playlists.py
│   │   └── validate_playlists.py
│   ├── discovery/           # Discovery and fetching tools
│   │   ├── discover_playlists.py
│   │   └── fetch_missing_playlists.py
│   ├── spotify/             # Spotify integration scripts
│   │   ├── index-spotify-tracks.js
│   │   ├── recover-missing-tracks.js
│   │   └── enrich-artist-images.js
│   ├── lastfm/              # Last.fm integration
│   │   └── fetch-artist-bios.js
│   └── consolidate-genres.js # Tag consolidation from multiple sources
├── docker/                  # Docker environments
│   ├── Dockerfile.parse     # Parser environment
│   ├── Dockerfile.discover  # Discovery environment
│   └── Dockerfile.fetch     # Fetcher environment
├── data/                    # Generated analysis data
│   ├── discovered_playlists.json
│   └── gap_analysis.json
├── QUICKSTART.md            # Quick start guide
├── WORKFLOW.md              # Detailed workflow documentation
├── CLAUDE.md                # Development process documentation
└── README.md                # This file
```

## Workflow - Maintaining the Archive

**New to the project?** See [WORKFLOW.md](WORKFLOW.md) for detailed instructions.

### Quick Commands

```bash
# Update playlists after editing txt files (fast - ~1 second)
./update-playlists.sh

# Discover new playlists on KCUR (slow - ~30 seconds)
./discover.sh

# Index tracks with Spotify (very slow - ~7-10 minutes)
./index-spotify.sh

# Fetch artist bios from Last.fm (~5 minutes)
node scripts/lastfm/fetch-artist-bios.js

# Enrich artist images from Spotify (~2 minutes)
node scripts/spotify/enrich-artist-images.js

# Consolidate tags from all sources (~1 minute)
node scripts/consolidate-genres.js
```

### Common Tasks

**Fix errors in a playlist:**
1. Edit the `.txt` file in `archive/txt/`
2. Run `./update-playlists.sh`
3. Check validation report

**Add a new playlist:**
1. Create a new `.txt` file in `archive/txt/` (format: `YYYY-MM-DD.txt`)
2. Run `./update-playlists.sh`
3. Optionally run `./index-spotify.sh` for Spotify links

See [WORKFLOW.md](WORKFLOW.md) for complete documentation.

## Tools & Scripts

### Data Pipeline Scripts

#### Parser (`scripts/parsing/parse_playlists.py`)
Converts raw text files to structured JSON. Handles multiple playlist formats and extracts artist/song information.

```bash
./update-playlists.sh
```

#### Discovery Tool (`scripts/discovery/discover_playlists.py`)
Scrapes KCUR website to find available playlists and identify gaps in the archive.

```bash
./discover.sh
```

### API Integration Scripts

All API scripts require credentials in a `.env` file. See [scripts/spotify/README.md](scripts/spotify/README.md) for setup.

#### Spotify Track Indexer (`scripts/spotify/index-spotify-tracks.js`)
Indexes all tracks with Spotify API to provide direct track links in the web app.

```bash
./index-spotify.sh
# or: node scripts/spotify/index-spotify-tracks.js
```

#### Spotify Track Recovery (`scripts/spotify/recover-missing-tracks.js`)
Interactive tool to manually match tracks that weren't found automatically.

```bash
node scripts/spotify/recover-missing-tracks.js
```

#### Last.fm Artist Bios (`scripts/lastfm/fetch-artist-bios.js`)
Fetches artist biographies, tags, and statistics from Last.fm API.

```bash
LASTFM_API_KEY=your_key node scripts/lastfm/fetch-artist-bios.js
```

#### Spotify Artist Images (`scripts/spotify/enrich-artist-images.js`)
Enriches artist data with high-quality images from Spotify (since Last.fm no longer provides images).

```bash
node scripts/spotify/enrich-artist-images.js
```

#### Tag Consolidation (`scripts/consolidate-genres.js`)
Merges tags from multiple sources (Last.fm tags, Spotify artist genres, track genres) into a unified tag system.

```bash
node scripts/consolidate-genres.js
```

## Historical Significance

This archive is particularly valuable because:

1. **Preservation**: Many of these playlists (100+ from 2009-2017) are no longer easily accessible on KCUR's website
2. **Cultural Heritage**: Documents nearly 8 years of Kansas City's music culture through Bill Shapiro's unique perspective
3. **Musical Diversity**: Showcases an eclectic mix of genres from a legendary radio host
4. **Structured Data**: Makes 40+ years of musical curation searchable and analyzable

## Sources

- Original playlists: [KCUR Cyprus Avenue Tag](https://www.kcur.org/tags/cyprus-avenue)
- About the show: [Cyprus Avenue on KCUR](https://www.kcur.org/show/cyprus-avenue)

## Technology Stack

- **Web Application**: Vue 3, TypeScript, Vite, Tailwind CSS
- **Backend Scripts**: Python 3, Node.js
- **APIs**: Spotify Web API, Last.fm API
- **Deployment**: GitHub Pages (via GitHub Actions)
- **Containerization**: Docker for reproducible parsing

## License

This archive is created for preservation and educational purposes. The original content is © KCUR Kansas City Public Radio. Track listings and metadata are provided as-is for archival purposes.

---

*This archive represents an important preservation effort of Kansas City's musical cultural heritage and the legacy of Bill Shapiro's Cyprus Avenue.*

*Built with [Claude Code](https://claude.com/claude-code) - see [CLAUDE.md](CLAUDE.md) for development history.*
