# Quick Start Guide

Get started with the Cyprus Avenue archive in 30 seconds.

## View the Archive

Browse playlists, artists, and tracks:
```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Web App Features

- **Browse Playlists** - 125 shows with expandable track lists
- **Discover Artists** - 277+ artists with bios, images, and tags
- **Search Tracks** - Instant search across 1,448 tracks
- **Spotify Integration** - Listen in-browser, create playlists with one click
- **Tag Filtering** - Explore artists by genre/tag

## Update Playlists

With Python 3 installed, after editing a retained input (see [data ownership](data/source/README.md)):
```bash
./update-playlists.sh
```

That's it! Your changes are now in the JSON files and ready for the web app.

## Key Commands

See [WORKFLOW.md](WORKFLOW.md) for Node/Python requirements, scraper virtual
environment setup, credentials, and all root npm commands.

```bash
# Data Pipeline
./update-playlists.sh   # Parse txt → json (fast - ~1 sec)
./discover.sh           # Find new playlists online (slow - ~30 sec)
./index-spotify.sh      # Add Spotify links (very slow - ~10 min)

# Artist Metadata (optional - enriches artist pages)
node scripts/lastfm/fetch-artist-bios.js      # Fetch artist bios
node scripts/spotify/enrich-artist-images.js  # Add artist images
npm run refresh:genres                      # Fetch and retain Spotify genres
npm run data:tags                             # Merge tags offline
```

## Next Steps

- **Read [WORKFLOW.md](WORKFLOW.md)** - Complete workflow documentation
- **Read [README.md](README.md)** - Project overview and data formats
- **See [scripts/spotify/README.md](scripts/spotify/README.md)** - Spotify API setup
- **See [CLAUDE.md](CLAUDE.md)** - Development history and technical details

## Common Workflow

1. Edit a playlist: `vim archive/txt/2015-01-03.txt`
2. Update JSON: `./update-playlists.sh`
3. Check validation report for any issues
4. View changes in web app: `cd web && npm run dev`

Done!
