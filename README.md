# Cyprus Avenue Playlist Archive

A comprehensive archive of playlists from KCUR's legendary **Cyprus Avenue** radio show, hosted by Bill Shapiro for over 40 years (1978-2018).

## About Cyprus Avenue

Cyprus Avenue was a Saturday night institution on KCUR 89.3 FM in Kansas City, featuring "the world of popular music from gospel to rock - from country to reggae - from a different point of view." Bill Shapiro, a Kansas City tax attorney by day and music enthusiast by night, curated unique playlists introducing listeners to both classic and contemporary artists across all genres. He passed away in January 2020 at age 82.

## Archive Contents

This archive preserves **125 Cyprus Avenue playlists** spanning nearly 8 years:

- **Total Playlists**: 125
- **Total Tracks**: 1,506
- **Date Range**: December 12, 2009 to July 14, 2017
- **Average Tracks per Show**: 12.0

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
├── json/
│   ├── individual/          # 125 individual playlist JSON files
│   └── playlists.json       # Consolidated file with all playlists
├── archive/
│   └── txt/                 # Original copy/pasted text files
├── scripts/
│   ├── parsing/             # Parser tools
│   │   └── parse_playlists.py
│   ├── discovery/           # Discovery and fetching tools
│   │   ├── discover_playlists.py
│   │   └── fetch_missing_playlists.py
│   └── spotify/             # Spotify integration scripts
│       └── index-spotify-tracks.js
├── docker/                  # Docker environments
│   ├── Dockerfile.parse     # Parser environment
│   ├── Dockerfile.discover  # Discovery environment
│   └── Dockerfile.fetch     # Fetcher environment
├── data/                    # Generated analysis data
│   ├── discovered_playlists.json
│   └── gap_analysis.json
├── ARCHIVE_REPORT.md        # Detailed archive report
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

### Parser (`scripts/parsing/parse_playlists.py`)
Converts raw text files to structured JSON. Handles multiple playlist formats and extracts artist/song information.

**Via convenience script (recommended):**
```bash
./update-playlists.sh
```

**Or directly with Docker:**
```bash
docker build -f docker/Dockerfile.parse -t cyprus-avenue-parser .
docker run --rm \
  -v /path/to/project/archive/txt:/app/txt \
  -v /path/to/project/json:/app/json \
  -v /path/to/project/web/public:/app/web/public \
  cyprus-avenue-parser
```

### Discovery Tool (`scripts/discovery/discover_playlists.py`)
Scrapes KCUR website to find available playlists and identify gaps in the archive.

**Via convenience script (recommended):**
```bash
./discover.sh
```

**Or directly with Docker:**
```bash
docker build -f docker/Dockerfile.discover -t cyprus-avenue-discover .
docker run --rm -v /path/to/project:/app cyprus-avenue-discover
```

### Spotify Indexer (`scripts/spotify/index-spotify-tracks.js`)
Indexes all tracks with Spotify API to provide direct track links in the web app.

**Via convenience script (recommended):**
```bash
./index-spotify.sh
```

**Or directly with Node.js:**
```bash
node scripts/spotify/index-spotify-tracks.js
```

See [scripts/spotify/README.md](scripts/spotify/README.md) for Spotify API setup.

## Historical Significance

This archive is particularly valuable because:

1. **Preservation**: Many of these playlists (100+ from 2009-2017) are no longer easily accessible on KCUR's website
2. **Cultural Heritage**: Documents nearly 8 years of Kansas City's music culture through Bill Shapiro's unique perspective
3. **Musical Diversity**: Showcases an eclectic mix of genres from a legendary radio host
4. **Structured Data**: Makes 40+ years of musical curation searchable and analyzable

## Sources

- Original playlists: [KCUR Cyprus Avenue Tag](https://www.kcur.org/tags/cyprus-avenue)
- About the show: [Cyprus Avenue on KCUR](https://www.kcur.org/show/cyprus-avenue)

## License

This archive is created for preservation and educational purposes. The original content is © KCUR Kansas City Public Radio. Track listings and metadata are provided as-is for archival purposes.

---

*This archive represents an important preservation effort of Kansas City's musical cultural heritage and the legacy of Bill Shapiro's Cyprus Avenue.*
