# Quick Start Guide

Get started with the Cyprus Avenue archive in 30 seconds.

## View the Archive

Browse playlists and tracks:
```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Update Playlists

After editing any `.txt` file:
```bash
./update-playlists.sh
```

That's it! Your changes are now in the JSON files and ready for the web app.

## Three Commands You Need

```bash
./update-playlists.sh   # Parse txt → json (fast - ~1 sec)
./discover.sh           # Find new playlists online (slow - ~30 sec)
./index-spotify.sh      # Add Spotify links (very slow - ~10 min)
```

## Next Steps

- **Read [WORKFLOW.md](WORKFLOW.md)** - Complete workflow documentation
- **Read [README.md](README.md)** - Project overview and data formats
- **See [scripts/spotify/README.md](scripts/spotify/README.md)** - Spotify API setup

## Common Workflow

1. Edit a playlist: `vim archive/txt/2015-01-03.txt`
2. Update JSON: `./update-playlists.sh`
3. Check validation report for any issues
4. View changes in web app

Done!
