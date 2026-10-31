# Cyprus Avenue Archive - Web Application

A Vue 3 web application for browsing and searching the Cyprus Avenue radio show playlist archive with integrated Spotify playback.

## Features

- **Browse Playlists** - 125 shows with expandable track lists
- **Discover Artists** - 277+ artists with bios, images, and tags
- **Search Tracks** - Instant search across 1,506 tracks
- **Spotify Integration**:
  - In-browser playback (Premium required)
  - One-click playlist creation
  - 4 modes: individual shows, complete archive, by artist, by tag
- **Tag Filtering** - Explore artists by genre/tag
- **Multi-Platform Streaming** - Links to Spotify, Apple Music, YouTube Music
- **"This Week in History"** - See playlists from the same date in past years
- **Responsive Design** - Works on mobile and desktop

## Tech Stack

- **Vue 3.4** with Composition API (`<script setup>`)
- **TypeScript 5** for type safety
- **Vite 5** for fast development
- **Vue Router 4** for client-side routing
- **Tailwind CSS 3** for styling
- **Spotify Web API** for track linking and playlist creation
- **Spotify Web Playback SDK** for in-browser playback

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

Archive components, data composables, and URL helpers live in `src/components/`,
`src/composables/`, and `src/utils/`. Spotify components, OAuth, playback, API
transport, track selection/matching, callback view, and types live together in
`src/features/spotify/`. `SpotifyActionHost.vue` owns resuming OAuth actions;
cards and the web player do not read pending storage.

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | HomePage | Landing page with suggestions |
| `/playlists` | PlaylistList | Browse all playlists |
| `/playlist/:slug` | PlaylistCard | Individual playlist |
| `/artists` | ArtistsView | Browse artists with tag filtering |
| `/artist/:slug` | ArtistCard | Individual artist |
| `/tracks` | TracksView | Searchable track listing |
| `/auth/callback` | SpotifyCallback | OAuth callback |

## Data Files

The application loads data from three JSON files in `/public/`:

- **playlists.json** - All 125 playlists with tracks
- **spotify-index.json** - Track → Spotify URL mappings
- **artist-bios.json** - Artist bios, images, tags, and stats

To update data, run the scripts in the parent directory's `scripts/` folder.

## Environment Variables

Browsing and external streaming links work without Spotify configuration.
For optional playback and playlist creation, put the public client ID in
`web/.env.local` (or provide it in the build environment):

```bash
VITE_SPOTIFY_CLIENT_ID=your_public_client_id
# Optional canonical origin; otherwise use the current browser origin:
# VITE_SITE_URL=https://riebschlager.github.io
# Optional exact registered callback override:
# VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/auth/callback
```

Register the exact callback URL with your Spotify application. By default it is
`<site origin><Vite base>/auth/callback`: local development uses `/auth/callback`,
and the default production build uses `/cyprus-avenue/auth/callback`.
`BASE_PATH=/` also changes the default callback for custom-domain deployments.
`SPOTIFY_CLIENT_ID` remains supported as a build-environment alias for existing CI.
There is no built-in client ID fallback. Never put a client secret in browser
configuration; secrets belong only to the separate archive maintenance scripts.

All playlist modes share one creation runner. Individual shows preserve repeats;
archive, artist, and tag modes deduplicate exact artist/song pairs. Show and artist
modes may search Spotify; archive and tag modes use only indexed matches. Each
API request obtains a valid token, and simultaneous refreshes share one request.
Successful batches are never automatically replayed after a failure; the error
identifies the created playlist and confirmed track count so it can be reviewed.

`npm test` runs offline regression checks with mocked Spotify and SDK responses.
Live OAuth and playback still require a configured Spotify application/account.

## Deployment

Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `master`. The build uses base path `/cyprus-avenue/` (override with `BASE_PATH`) and copies `index.html` to `404.html` for SPA deep links.

```bash
npm run build
# Deploy dist/ folder
```

## License

This project archives publicly available radio show playlists from KCUR for educational and preservation purposes.
