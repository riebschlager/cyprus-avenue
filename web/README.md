# Cyprus Avenue Archive - Web Application

A Vue 3 web application for browsing and searching the Cyprus Avenue radio show playlist archive.

## Features

- 📻 Browse 119 playlists from KCUR's Cyprus Avenue show
- 🔍 Full-text search across playlists, artists, and songs
- 📊 Archive statistics dashboard
- 🎵 Expandable playlist cards with full track listings
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** for fast development
- **Tailwind CSS** for styling

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
├── components/          # Vue components
│   ├── PlaylistCard.vue    # Individual playlist card
│   ├── PlaylistList.vue    # List of playlists
│   ├── SearchBar.vue       # Search input
│   └── StatsPanel.vue      # Statistics dashboard
├── composables/         # Vue composables
│   └── usePlaylists.ts     # Playlist data management
├── types/              # TypeScript types
│   └── playlist.ts         # Playlist data types
├── App.vue             # Main application component
├── main.ts             # Application entry point
└── style.css           # Global styles (Tailwind)

public/
└── playlists.json      # Playlist data
```

## Data

The application loads playlist data from `/public/playlists.json`, which contains all archived Cyprus Avenue playlists. To update the data, regenerate the JSON file using the parser in the parent directory.

## License

This project archives publicly available radio show playlists from KCUR for educational and preservation purposes.
