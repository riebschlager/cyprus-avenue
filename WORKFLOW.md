# Cyprus Avenue Development Workflow

This document explains how to maintain and update the Cyprus Avenue playlist archive.

## Quick Reference

```bash
./update-playlists.sh   # Fast (~1 sec) - Parse txt → json
./discover.sh           # Slow (~30 sec) - Find missing playlists online
./index-spotify.sh      # Very slow (~7-10 min) - Index tracks with Spotify
```

---

## Workflow Overview

The Cyprus Avenue archive uses a three-stage data pipeline:

```
┌─────────────┐
│  TXT Files  │  archive/txt/*.txt (119 files)
└──────┬──────┘
       │ Step 1: ./update-playlists.sh
       ↓
┌─────────────┐
│ JSON Files  │  json/individual/*.json (125 files)
│             │  json/playlists.json (consolidated)
│             │  web/public/playlists.json (web app copy)
└──────┬──────┘
       │ Step 3: ./index-spotify.sh
       ↓
┌─────────────┐
│   Spotify   │  web/public/spotify-index.json
│    Index    │  (Direct track links)
└─────────────┘

       Step 2: ./discover.sh (separate - finds new content)
```

---

## Step 1: Update Playlists (Fast ⚡)

**When to use:** After editing any `.txt` files

**What it does:**
- Parses all `archive/txt/*.txt` files
- Generates `json/individual/*.json` files
- Creates consolidated `json/playlists.json`
- Copies to `web/public/playlists.json` for the web app
- Validates data quality and shows report
- Preserves JSON files without txt sources (fetched playlists)

**Usage:**
```bash
./update-playlists.sh
```

**Time:** < 1 second

**Example output:**
```
🔄 Cyprus Avenue - Update Playlists
====================================

📝 Parsing playlist files...

Found 119 playlist files to parse...
Parsing 2009-12-12.txt... ✓ (10 tracks)
...
✓ Preserved 6 existing JSON files without txt sources
✓ Copied to web app: web/public/playlists.json

============================================================
Parsing complete!
============================================================
Total playlists parsed: 125
Total tracks: 1449

🔍 Running validation...

✅ Validation PASSED - Data is ready to use!
```

### Editing TXT Files

1. Edit any file in `archive/txt/`
2. Run `./update-playlists.sh`
3. Check validation report for issues
4. Fix any errors and run again

**Common txt file formats handled:**
- `Artist - Song`
- `Artist - "Song"`
- `"Song"` (for single-artist shows)
- `Artist, Album` (for best-of lists)

---

## Step 2: Discover Playlists (Slow 🐌)

**When to use:** Occasionally, to check for new playlists on KCUR's website

**What it does:**
- Scrapes KCUR.org for Cyprus Avenue content
- Compares against your local archive
- Generates `data/discovered_playlists.json` (all found)
- Generates `data/gap_analysis.json` (missing from archive)

**Usage:**
```bash
./discover.sh
```

**Time:** ~30-60 seconds

**Notes:**
- Requires internet connection
- Checks multiple pagination strategies
- Filters out news articles (only music playlists)

**What to do with results:**
1. Check `data/gap_analysis.json`
2. If missing playlists found, manually fetch and add to `archive/txt/`
3. Run `./update-playlists.sh` to parse new content

---

## Step 3: Index Spotify (Very Slow 🐢)

**When to use:** After adding significant new content (10+ new playlists)

**What it does:**
- Searches Spotify for every unique track
- Creates `web/public/spotify-index.json` with direct track links
- Shows match confidence (high/medium/low)

**Prerequisites:**
```bash
# Option 1: Create .env file (recommended)
cp .env.example .env
# Edit .env and add:
# SPOTIFY_CLIENT_ID=your_id_here
# SPOTIFY_CLIENT_SECRET=your_secret_here

# Option 2: Set environment variables
export SPOTIFY_CLIENT_ID=your_id
export SPOTIFY_CLIENT_SECRET=your_secret
```

Get credentials from: https://developer.spotify.com/dashboard

**Usage:**
```bash
./index-spotify.sh
```

**Time:** ~7-10 minutes (for ~1,449 tracks)

**Why so slow:**
- Spotify API rate limit: 100 requests / 30 seconds
- Script includes 350ms delay between requests
- Must search for each unique track individually

**Results:**
- ~90% of tracks found on Spotify
- ~88% high-confidence matches
- Direct Spotify URLs for the web app

---

## Common Scenarios

### Scenario 1: Fix Errors in Existing Playlists

```bash
# 1. Edit the txt file
vim archive/txt/2015-01-03.txt

# 2. Regenerate JSON
./update-playlists.sh

# 3. Check validation report
# If issues found, fix and repeat
```

### Scenario 2: Add a New Playlist

```bash
# 1. Create new txt file with date
echo "My New Playlist" > archive/txt/2024-01-15.txt
echo "Artist - Song" >> archive/txt/2024-01-15.txt

# 2. Parse into JSON
./update-playlists.sh

# 3. (Optional) Re-index Spotify for new tracks
# Only if you want direct Spotify links
./index-spotify.sh
```

### Scenario 3: Complete Archive Refresh

```bash
# 1. Check for new content online
./discover.sh

# 2. Add any missing playlists to archive/txt/

# 3. Parse everything
./update-playlists.sh

# 4. Re-index Spotify
./index-spotify.sh
```

### Scenario 4: Just Testing Changes

```bash
# Parse without re-indexing Spotify
./update-playlists.sh

# Web app will use existing Spotify index
# Only re-run ./index-spotify.sh when ready
```

---

## Data Quality Validation

The validation report checks for:

**Critical Issues (❌ Fails validation):**
- Empty playlists (0 tracks)
- Duplicate dates
- Invalid JSON files
- Mismatch between individual and consolidated files

**Warnings (⚠️ Passes with warnings):**
- Missing artist or song fields
- Missing titles
- Missing dates

**How to fix issues:**

1. Check the validation output
2. Edit the corresponding `.txt` file
3. Run `./update-playlists.sh` again
4. Repeat until validation passes

---

## File Structure Reference

```
cyprus-avenue/
├── archive/
│   └── txt/                    # Source files (119 files)
│       └── 2015-01-03.txt      # Copy/pasted playlist text
│
├── json/
│   ├── individual/             # Parsed playlists (125 files)
│   │   └── 2015-01-03.json     # Individual playlist JSON
│   └── playlists.json          # All playlists consolidated
│
├── web/
│   └── public/
│       ├── playlists.json      # Copy for web app (auto-generated)
│       └── spotify-index.json  # Spotify track mappings (from Step 3)
│
├── data/
│   ├── discovered_playlists.json  # From ./discover.sh
│   └── gap_analysis.json          # Missing playlists report
│
├── scripts/
│   ├── parsing/
│   │   ├── parse_playlists.py     # Main parser
│   │   └── validate_playlists.py  # Data validator
│   ├── discovery/
│   │   ├── discover_playlists.py  # Web scraper
│   │   └── fetch_missing_playlists.py
│   └── spotify/
│       └── index-spotify-tracks.js  # Spotify indexer
│
├── update-playlists.sh         # Step 1: Parse txt → json
├── discover.sh                 # Step 2: Find new content
└── index-spotify.sh            # Step 3: Index with Spotify
```

---

## Docker Details

All scripts use Docker to ensure consistent execution:

- **update-playlists.sh**: Uses `cyprus-avenue-parser` image (Python 3.11)
- **discover.sh**: Uses `cyprus-avenue-discover` image (Python 3.11 + requests + beautifulsoup4)
- **index-spotify.sh**: Runs directly with Node.js (requires local installation)

Docker images are built automatically on first run and reused on subsequent runs.

---

## Troubleshooting

### "docker: Error response from daemon"

Make sure Docker is running:
```bash
docker info
```

### "$(pwd) includes invalid characters"

Your shell doesn't support `$(pwd)`. The scripts now use absolute paths automatically.

### "Validation FAILED"

Check the validation output for specific issues. Common fixes:
- Empty playlists: Add tracks or delete the txt file
- Duplicate dates: Rename one of the files
- Missing fields: Check txt file formatting

### "Spotify credentials not found"

Create a `.env` file or set environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

### Web app not showing updates

Make sure `web/public/playlists.json` was updated:
```bash
ls -lh web/public/playlists.json
# Should show recent timestamp
```

---

## Best Practices

1. **Always run `./update-playlists.sh` after editing txt files**
   - Fast and safe to run frequently
   - Validates your changes immediately

2. **Only run `./index-spotify.sh` when needed**
   - Very time-consuming (~10 minutes)
   - Only necessary after adding many new tracks
   - Existing tracks already indexed don't need re-indexing

3. **Run `./discover.sh` periodically**
   - Once a month to check for new KCUR content
   - Or when you know new shows were published

4. **Keep txt files clean**
   - One playlist per file
   - Named with date: `YYYY-MM-DD.txt`
   - Follow standard format patterns

5. **Check validation reports**
   - Fix critical issues before committing
   - Warnings are okay but try to minimize them

---

## Questions or Issues?

- Check validation output for specific error messages
- Review txt file formatting against working examples
- See [README.md](README.md) for general project information
- See [CLAUDE.md](CLAUDE.md) for development history
