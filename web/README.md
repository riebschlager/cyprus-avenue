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

```
src/
├── components/              # 17 Vue components
│   ├── HomePage.vue            # Landing page with suggestions
│   ├── PlaylistCard.vue        # Expandable playlist card
│   ├── PlaylistList.vue        # Paginated playlist grid
│   ├── ArtistCard.vue          # Artist with bio, tags, image
│   ├── ArtistsView.vue         # Artists list with tag filtering
│   ├── TracksView.vue          # Searchable tracks table
│   ├── TracksTable.vue         # Track listing component
│   ├── SearchBar.vue           # Search input
│   ├── StatsPanel.vue          # Archive statistics
│   ├── StreamingLinks.vue      # Multi-platform dropdown
│   ├── SpotifyAuthButton.vue   # OAuth login button
│   ├── SpotifyWebPlayer.vue    # In-browser music player
│   ├── SpotifyPlaylistModal.vue # Playlist creation modal
│   ├── PlaylistCreationProgress.vue # Creation progress indicator
│   ├── TrackMatchingSummary.vue    # Results display
│   ├── Toast.vue               # Notification component
│   └── ToastContainer.vue      # Notification container
├── composables/             # 12 reusable composables
│   ├── usePlaylists.ts         # Singleton playlist data
│   ├── useArtists.ts           # Artist aggregation
│   ├── useTracks.ts            # Track aggregation
│   ├── useArtistBios.ts        # Artist metadata
│   ├── useStreamingLinks.ts    # Platform URLs
│   ├── useDropdownState.ts     # Dropdown coordination
│   ├── useSpotifyAuth.ts       # OAuth 2.0 PKCE flow
│   ├── useSpotifyPlayback.ts   # Web player state
│   ├── useSpotifyPlaylistCreation.ts # Playlist creation
│   ├── useToast.ts             # Notifications
│   ├── useOpenGraph.ts         # Meta tags
│   └── useMobileMenu.ts        # Mobile nav state
├── views/                   # Route components
│   └── SpotifyCallback.vue     # OAuth callback handler
├── utils/                   # Utility functions
│   ├── slugs.ts                # URL slug generation
│   ├── spotifyApi.ts           # Spotify API client
│   ├── spotifyConstants.ts     # OAuth config
│   ├── trackMatching.ts        # Track matching logic
│   └── tagFilters.ts           # Tag normalization
├── types/                   # TypeScript types
│   ├── playlist.ts             # Playlist data types
│   └── spotify.ts              # Spotify API types
├── router/
│   └── index.ts                # Vue Router config
├── App.vue                  # Main app with sticky header
├── main.ts                  # Entry point
└── style.css                # Global styles

public/
├── playlists.json           # Playlist data (~180 KB)
├── spotify-index.json       # Spotify track mappings (~460 KB)
└── artist-bios.json         # Artist metadata (~1.4 MB)
```

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

For Spotify Web Player and playlist creation, set these in the parent `.env`:

```bash
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

## Deployment

Deployed on Netlify with SPA redirects configured in `netlify.toml`.

```bash
npm run build
# Deploy dist/ folder
```

## License

This project archives publicly available radio show playlists from KCUR for educational and preservation purposes.
