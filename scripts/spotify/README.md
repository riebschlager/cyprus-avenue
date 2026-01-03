# Spotify Track Indexing

This script indexes all tracks from the Cyprus Avenue archive with Spotify's API, creating direct links to tracks on Spotify.

## Setup

### 1. Get Spotify API Credentials

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account (or create one)
3. Click "Create app"
4. Fill in the details:
   - **App name**: Cyprus Avenue Archive
   - **App description**: Track indexing for radio show archive
   - **Redirect URI**: http://localhost (not used, but required)
   - **API**: Check "Web API"
5. Click "Save"
6. You'll see your **Client ID** and **Client Secret**

### 2. Configure Credentials

**Option A: Using .env file (Recommended)**

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials
# SPOTIFY_CLIENT_ID=your_client_id_here
# SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Option B: Using environment variables**

```bash
SPOTIFY_CLIENT_ID=your_client_id_here \
SPOTIFY_CLIENT_SECRET=your_client_secret_here \
node scripts/spotify/index-spotify-tracks.js
```

### 3. Run the Indexing Script

```bash
# From the project root directory
node scripts/spotify/index-spotify-tracks.js
```

The script will:
- Index all 1,449 unique tracks
- Take approximately 7-10 minutes to complete
- Show progress as it runs
- Save results to `web/public/spotify-index.json`

### 3. What You'll See

```
📀 Cyprus Avenue Spotify Track Indexer
=====================================

Found 1449 unique tracks to index

🔑 Obtaining Spotify access token...
✓ Token obtained successfully

[1/1449] Searching: Bob Dylan - Like a Rolling Stone... ✓ (high)
[2/1449] Searching: Elvis Presley - Hound Dog... ✓ (high)
[3/1449] Searching: Van Morrison - Cyprus Avenue... ✓ (high)
...
```

### 4. Results

After completion, you'll see a summary like:

```
=====================================
✨ Indexing Complete!
=====================================
Total tracks:        1449
Found on Spotify:    1302 (89.9%)
Not found:           147 (10.1%)

Match Confidence:
  High:              1150 (88.3%)
  Medium:            125 (9.6%)
  Low:               27 (2.1%)

Output saved to: web/public/spotify-index.json
File size: 245.3 KB
```

## Output Format

The script creates `web/public/spotify-index.json`:

```json
{
  "Bob Dylan|Like a Rolling Stone": {
    "spotifyId": "3AhXZa8sUQht0UEdBJgpGc",
    "spotifyUrl": "https://open.spotify.com/track/3AhXZa8sUQht0UEdBJgpGc",
    "previewUrl": "https://p.scdn.co/mp3-preview/...",
    "albumArt": "https://i.scdn.co/image/ab67616d0000b273...",
    "artistName": "Bob Dylan",
    "trackName": "Like a Rolling Stone",
    "confidence": "high"
  }
}
```

## Re-running

To re-index (e.g., after adding new playlists):

```bash
# Just run the same command again
SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/spotify/index-spotify-tracks.js
```

The script will overwrite the existing index file.

## Troubleshooting

**"Missing Spotify credentials"**
- Make sure you're setting the environment variables correctly
- Try running with `echo $SPOTIFY_CLIENT_ID` to verify

**"Failed to obtain access token"**
- Verify your Client ID and Client Secret are correct
- Make sure you copied them without extra spaces

**Rate limiting errors**
- The script includes built-in rate limiting (350ms between requests)
- If you still get errors, the delay can be increased in the script

## Recovering Missing Tracks

After the initial indexing, some tracks may not be found due to:
- Album names mistakenly used as song titles
- Artist names duplicated in song field
- Featured artists in parentheses
- Typos or parsing errors

Use the **interactive recovery tool** to find and fix these:

```bash
node scripts/spotify/recover-missing-tracks.js
```

### How It Works

The recovery tool:

1. **Loads missing tracks** from `data/spotify-not-found.json`
2. **Tries multiple search strategies** for each track:
   - Default search (artist + track)
   - Simplified (removes featuring artists, special characters)
   - Artist-only (for duplicate names or album titles)
   - Album search (when song field looks like album name)
   - Loose search (broad match)

3. **Shows you the results** interactively:
   ```
   [1/178] Bob Dylan - Together Through Life

     Strategy: album
     Results:
       1. "Life Is Hard" by Bob Dylan
          Album: Together Through Life
          URL: https://open.spotify.com/track/...
       2. "Beyond Here Lies Nothin'" by Bob Dylan
          Album: Together Through Life
          URL: https://open.spotify.com/track/...
       3. "My Wife's Home Town" by Bob Dylan
          Album: Together Through Life
          URL: https://open.spotify.com/track/...

     Select (1-3), Skip (s), or Quit (q):
   ```

4. **You choose**:
   - Enter `1`, `2`, or `3` to select a match
   - Enter `s` to skip this track
   - Enter `q` to quit and save progress

5. **Updates the index** automatically with your selections

6. **Saves results**:
   - Updates `web/public/spotify-index.json` with recovered tracks
   - Updates `data/spotify-not-found.json` with remaining missing tracks
   - Creates `data/spotify-recovery-report.json` with recovery details

### Example Session

```bash
$ node scripts/spotify/recover-missing-tracks.js

🎵 Spotify Missing Track Recovery Tool

Found 178 missing tracks

✓ Authenticated with Spotify

[1/178] Bob Dylan - Together Through Life

  Strategy: album
  Results:
    1. "Life Is Hard" by Bob Dylan
       Album: Together Through Life
    2. "Beyond Here Lies Nothin'" by Bob Dylan
       Album: Together Through Life

  Select (1-3), Skip (s), or Quit (q): 1
  ✓ Added to index

[2/178] Marty Stuart - Crying, Waiting, Hoping (with Steve Earle)

  Strategy: simplified
  Results:
    1. "Crying, Waiting, Hoping" by Marty Stuart, Steve Earle
       Album: The Pilgrim

  Select (1-3), Skip (s), or Quit (q): 1

  ⚠️  Data mismatch detected:
     Original:  "Marty Stuart" - "Crying, Waiting, Hoping (with Steve Earle)"
     Spotify:   "Marty Stuart" - "Crying, Waiting, Hoping"
  Update source playlists with Spotify data? (y/n): y
  ✓ Added to index

...

📝 Updating source playlists...
   ✓ Updated 12 tracks across 3 playlists

✅ Recovery complete!
   Recovered: 45
   Skipped: 8
   Still missing: 125
   Source corrections: 12

   Updated spotify-not-found.json with 125 remaining tracks
   Saved recovery report to data/spotify-recovery-report.json
```

### Tips

- **Album titles as songs**: When you see album names in the song field, select the first track or most popular track from that album
- **Duplicate names**: Artist name same as song name usually means it's a self-titled track or compilation
- **Featured artists**: The simplified strategy removes "(with X)" and "(feat. Y)" to find base tracks
- **Data corrections**: When the tool detects mismatches, you can choose to update the source playlist files with the correct Spotify metadata
- **Save progress**: You can quit anytime with `q` and your selections are saved immediately

### Source Data Corrections

When a track is successfully matched but the data differs from what's in the archive, the tool will:

1. **Detect the mismatch** and show you both versions:
   - Original archive data (possibly incorrect or incomplete)
   - Spotify's canonical data (verified from their database)

2. **Ask for confirmation** to update the source files

3. **Update all occurrences** across all playlists if you confirm

This helps improve the overall data quality of the archive by:
- Removing parsing artifacts like "(with Artist)" or "(feat. Artist)"
- Fixing typos in artist or song names
- Standardizing capitalization and formatting
- Replacing album names with actual track names

**Important**: Source corrections update `json/playlists.json`, which is the canonical data source. Individual playlist files in `json/individual/` are not modified by this tool.

### Protection Against Re-indexing

**Important**: Your manually-recovered tracks are protected!

The recovery tool marks each track you confirm with `manual: true`. When you run the main indexing script later (e.g., after adding new playlists), it will:

1. **Preserve** all manually-recovered tracks (skip re-searching them)
2. **Show** them as "preserved" in the output: `⊙ (preserved)`
3. **Only search** for new tracks or tracks that failed in the original indexing

This means you can safely:
- Run the recovery tool first to fix missing tracks
- Run the main indexer later when you add new playlists
- Your manual work won't be lost!

## Enriching Artist Images

Since Last.fm's free API no longer provides artist images (as of January 2025), we use Spotify to fetch high-quality artist images.

### Usage

```bash
# From the project root directory
node scripts/spotify/enrich-artist-images.js
```

### What It Does

1. **Reads** `web/public/artist-bios.json` created by the Last.fm script
2. **Skips** artists that already have images
3. **Searches** Spotify for each artist
4. **Fetches** the largest available artist image
5. **Enriches** the bio data with:
   - High-resolution artist image URL
   - Spotify artist ID
   - Spotify artist URL
   - Popularity score (0-100)
   - Follower count

### Results

For the Cyprus Avenue archive:
- **276/277 artists** have images (99.6% coverage)
- Only 1 obscure gospel artist not found on Spotify
- Images are high quality (typically 640x640 or larger)

### Output Format

The enriched `artist-bios.json` includes both Last.fm and Spotify data:

```json
{
  "Bob Dylan": {
    "bio": "Full biography from Last.fm...",
    "bioSummary": "Short summary...",
    "tags": ["folk", "singer-songwriter", "rock"],
    "url": "https://www.last.fm/music/Bob+Dylan",
    "image": "https://i.scdn.co/image/...",
    "listeners": 4210627,
    "playcount": 286857662,
    "spotifyId": "74ASZWbe4lXaubB36ztrGX",
    "spotifyUrl": "https://open.spotify.com/artist/74ASZWbe4lXaubB36ztrGX",
    "popularity": 82,
    "followers": 6428197
  }
}
```

### Re-running

The script is **idempotent** - you can run it multiple times safely:
- Artists with images are skipped
- Only missing images are fetched
- Perfect for updating after adding new artists

### Rate Limiting

- Spotify allows ~10 requests/second for free tier
- Script includes 100ms delay between requests
- Automatic retry handling for rate limit errors
- Token auto-refresh every 58 minutes

## Notes

- The Spotify API has a rate limit of 100 requests per 30 seconds
- The script automatically handles this with delays between requests
- No user authentication is required (uses Client Credentials flow)
- The API is free for this use case
- Tracks not found are typically live versions, obscure recordings, or regional variations
