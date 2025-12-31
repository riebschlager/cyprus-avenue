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

## Notes

- The Spotify API has a rate limit of 100 requests per 30 seconds
- The script automatically handles this with delays between requests
- No user authentication is required (uses Client Credentials flow)
- The API is free for this use case
- Tracks not found are typically live versions, obscure recordings, or regional variations
