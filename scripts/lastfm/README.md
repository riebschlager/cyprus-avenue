# Last.fm Artist Bios

This script fetches artist biographies, images, and metadata from the Last.fm API for all artists in the Cyprus Avenue archive.

## Setup

### 1. Get a Last.fm API Key

1. Create a free Last.fm account at https://www.last.fm/join
2. Go to https://www.last.fm/api/account/create
3. Fill out the application form:
   - **Application name**: Cyprus Avenue Archive
   - **Application description**: Fetching artist bios for music archive
   - **Application homepage**: Your project URL or GitHub repo
   - **Callback URL**: (leave blank)
4. Click "Submit" and copy your API key

### 2. Set Environment Variable

```bash
export LASTFM_API_KEY=your_api_key_here
```

Or create a `.env` file in the project root (don't commit this!):

```bash
LASTFM_API_KEY=your_api_key_here
```

## Usage

Run the script from the project root:

```bash
node scripts/lastfm/fetch-artist-bios.js
```

The script will:
1. Read all unique artists from `web/public/playlists.json`
2. Fetch bio data for each artist from Last.fm API
3. Save results to `web/public/artist-bios.json`

## Output Format

The generated `artist-bios.json` file has this structure:

```json
{
  "Artist Name": {
    "bio": "Full biography text (HTML)",
    "bioSummary": "Short summary (HTML)",
    "tags": ["rock", "indie", "alternative"],
    "url": "https://www.last.fm/music/Artist+Name",
    "image": "https://lastfm.freetls.fastly.net/...",
    "listeners": 1234567,
    "playcount": 98765432
  }
}
```

## Rate Limiting

- Last.fm free tier: **60 requests per minute**
- Script runs at ~55 requests/minute to be safe
- For ~1,300 artists, expect runtime of **~24 minutes**

## What Gets Fetched

For each artist:
- ✅ Biography (full and summary versions)
- ✅ Artist image (extralarge/large size)
- ✅ Genre tags (top 10)
- ✅ Last.fm URL
- ✅ Listener and playcount statistics

## Troubleshooting

**"Artist not found" errors**: Normal for obscure artists or name mismatches. The script will continue and skip these.

**Rate limit errors**: The script has delays built in. If you still hit limits, increase `RATE_LIMIT_DELAY` in the script.

**API key not set**: Make sure `LASTFM_API_KEY` environment variable is set before running.

## Integration

The artist bios are automatically loaded and displayed in the web interface:

1. **Lazy Loading**: Bios load when first artist card is expanded
2. **Caching**: 15-minute cache (same as Spotify index)
3. **Display**: Shows in expanded artist view with image, bio, tags, and stats

See `web/src/composables/useArtistBios.ts` for implementation details.
