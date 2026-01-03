# Tag Consolidation

This script consolidates tag information from multiple sources (Last.fm tags + Spotify genres) to create a unified, comprehensive tag classification for each artist.

## Data Sources

The Cyprus Avenue archive has genre/tag data from three different sources:

1. **Last.fm Tags** (in `artist-bios.json`)
   - User-generated tags from Last.fm community
   - Examples: "folk", "singer-songwriter", "classic rock"
   - Generally high quality and specific
   - Stored in `tags` field

2. **Spotify Artist Genres** (fetched from Spotify API)
   - Official genre classifications from Spotify
   - Examples: "roots rock", "classic country", "modern blues"
   - Algorithmically determined by Spotify
   - More standardized but sometimes broader

3. **Spotify Track Genres** (in `spotify-index.json`)
   - Genres associated with specific tracks/albums
   - Examples: "americana", "alt country", "indie folk"
   - Can vary by album/era for the same artist
   - Most granular but potentially inconsistent

## The Problem

Having tag/genre data split across multiple files and formats creates several issues:

- **Fragmentation**: Tag/genre info scattered across different data sources
- **Duplication**: Same tags listed multiple times with different capitalization
- **Incompleteness**: Some artists have tags but no Spotify genres, or vice versa
- **No single source of truth**: Frontend doesn't know which field to use

## The Solution

The `consolidate-genres.js` script:

1. **Extracts** track genres from `spotify-index.json` and groups by artist
2. **Fetches** artist genres from Spotify API for artists with `spotifyId`
3. **Merges** all three sources with smart deduplication:
   - Normalizes tag strings (lowercase, trimmed)
   - Removes exact duplicates (case-insensitive)
   - Preserves original capitalization from highest-priority source
4. **Creates** unified `tags` field in `artist-bios.json`
5. **Adds** `tagSources` metadata showing contribution from each source

## Usage

```bash
# From the project root directory
node scripts/consolidate-genres.js
```

**Prerequisites**:
- `web/public/artist-bios.json` must exist (run Last.fm script first)
- `web/public/spotify-index.json` must exist (run Spotify indexing first)
- Spotify API credentials in `.env` file

## Output

The script updates `artist-bios.json` with two new fields:

```json
{
  "Bob Dylan": {
    "bio": "...",
    "bioSummary": "...",
    "lastfmTags": ["folk", "singer-songwriter", "classic rock", "folk rock", "rock"],
    "url": "https://www.last.fm/music/Bob+Dylan",
    "image": "https://i.scdn.co/image/...",
    "listeners": 4210627,
    "playcount": 286857662,
    "spotifyId": "74ASZWbe4lXaubB36ztrGX",
    "spotifyUrl": "https://open.spotify.com/artist/74ASZWbe4lXaubB36ztrGX",
    "popularity": 75,
    "followers": 7475190,

    "tags": [
      "folk",
      "singer-songwriter",
      "classic rock",
      "folk rock",
      "rock",
      "roots rock"
    ],
    "tagSources": {
      "lastfm": 5,
      "spotifyArtist": 4,
      "spotifyTracks": 4,
      "total": 6
    }
  }
}
```

### Field Descriptions

- **`lastfmTags`**: Original Last.fm tags only (preserved for reference)
- **`tags`**: Consolidated tags from all sources (use this in the UI)
- **`tagSources`**: Metadata showing:
  - `lastfm`: Number of tags from Last.fm
  - `spotifyArtist`: Number of genres from Spotify artist API
  - `spotifyTracks`: Number of unique genres from artist's tracks
  - `total`: Total unique tags after deduplication

## Results

For the Cyprus Avenue archive:

- **Total artists**: 277
- **With Spotify artist genres**: 227 (82%)
- **With track genres**: 193 (70%)
- **Total tags added**: 457
- **Average tags per artist**: 6

### Notable Improvements

- **Willie Nelson**: 5 Last.fm tags → 16 total tags (+11)
  - Gained: "classic country", "traditional country", "honky tonk", "texas country", etc.
- **Buddy Guy**: 5 Last.fm tags → 10 total tags (+5)
  - Gained: "classic blues", "blues rock", "modern blues", "electric blues", "chicago blues"
- **Collaboration artists**: Many gained tags where Last.fm had none
  - "Buddy Miller & Friends": 0 → 3 tags
  - "Willie & Merle": 0 → 5 tags

## Frontend Integration

Update your components to use the consolidated `tags` field:

```typescript
// Before (when fields were named differently)
const artistTags = bio.tags

// After (current naming)
const artistTags = bio.tags || bio.lastfmTags // Fallback to lastfmTags if tags not available
```

The TypeScript types in `web/src/types/artistBio.ts` have been updated to include:
- `lastfmTags: string[]` (original Last.fm tags only)
- `tags?: string[]` (consolidated from all sources)
- `tagSources?: TagSources`

## Re-running

The script is **idempotent** and can be safely re-run:

- Recalculates genres from scratch each time
- Useful after:
  - Adding new artists via Last.fm script
  - Re-indexing tracks via Spotify script
  - Manual corrections to track data

## Tag Priority

When multiple sources have the same tag (after normalization), the script uses this priority order for capitalization:

1. **Last.fm tags** (highest) - most human-curated
2. **Spotify artist genres** (medium) - official but algorithmic
3. **Spotify track genres** (lowest) - most specific but potentially noisy

Example: If Last.fm has "Chicago Blues" and Spotify has "chicago blues", the final list uses "Chicago Blues".

## Technical Details

### Normalization

Tags are normalized for comparison using:
```javascript
tag.toLowerCase().trim()
```

This catches duplicates like:
- "Blues" vs "blues"
- "Rock " vs "rock" (trailing space)
- "Classic Rock" vs "classic rock"

### Rate Limiting

- 50ms delay between Spotify API requests
- Processes ~20 artists per second
- Total runtime: ~15 seconds for 277 artists

### Memory Usage

The script loads all data into memory:
- `artist-bios.json`: ~1.3 MB
- `spotify-index.json`: ~245 KB
- Total memory footprint: <10 MB

Safe for systems with 512MB+ RAM.

## Troubleshooting

**"spotify-index.json not found"**
- Run `node scripts/spotify/index-spotify-tracks.js` first

**"Missing Spotify credentials"**
- Ensure `.env` file has `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`

**Tags look wrong for an artist**
- Check the `tagSources` field to see which source contributed what
- Consider manually editing `lastfmTags` in `artist-bios.json` for that artist
- Re-run the consolidation script to regenerate `tags`

**Want to exclude Spotify track genres**
- Comment out the track genre extraction section in the script
- This is useful if track genres are too noisy/specific

## Future Enhancements

Potential improvements:

1. **Tag hierarchies**: Map specific tags to broader categories
   - "chicago blues" → "blues" → "music"
2. **Synonym detection**: Treat "r&b" and "rhythm and blues" as same
3. **Weight by confidence**: Prioritize high-confidence sources
4. **Manual overrides**: Support a `tag-overrides.json` file
5. **Tag analytics**: Report most common tags, tag coverage by decade, etc.
