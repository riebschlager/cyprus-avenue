# Cyprus Avenue Playlist Archive

## Project Overview
This project is a comprehensive digital archive of playlists from **Cyprus Avenue**, a radio show hosted by Bill Shapiro on KCUR 89.3 FM (1978-2018). It serves to preserve the musical cultural heritage of the show and provides a modern web interface for browsing and listening.

The system consists of a **Data Processing Pipeline** (Python/Node.js) that transforms raw text playlists into structured data, and a **Web Application** (Vue 3) for end-users.

## Architecture

### 1. Data Pipeline
The archive is built on a "Text-to-JSON" pipeline:
1.  **Ingestion:** Raw playlists are stored as text files in `archive/txt/` (format: `YYYY-MM-DD.txt`).
2.  **Parsing:** Python scripts parse these text files into structured JSON (`json/individual/` and `json/playlists.json`).
3.  **Enrichment:** Node.js scripts fetch metadata from Spotify (links, images) and Last.fm (bios, tags).
4.  **Consolidation:** Finalized data is copied to `web/public/` for the frontend.

### 2. Web Application (`web/`)
A Single Page Application (SPA) built with:
*   **Framework:** Vue 3 (Composition API)
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **Routing:** Vue Router (History mode)
*   **Hosting:** Netlify

## Key Directories

*   `archive/txt/`: **Source of Truth.** Raw text files for each playlist.
*   `json/`: Generated JSON data. `playlists.json` is the consolidated database.
*   `web/`: The Vue 3 frontend application source code.
*   `scripts/`: Automation scripts.
    *   `parsing/`: Python parsers for converting `.txt` to `.json`.
    *   `discovery/`: Scrapers to find missing playlists on KCUR.org.
    *   `spotify/`: Node.js scripts for Spotify API integration.
    *   `lastfm/`: Node.js scripts for fetching artist bios.
*   `docker/`: Dockerfiles for containerized execution of scripts.
*   `data/`: Reports and intermediate analysis files (e.g., gaps, discovered content).

## Development Workflow

### Prerequisites
*   **Docker:** Required for running parsing and discovery scripts safely.
*   **Node.js:** Required for the web app and API enrichment scripts.
*   **Environment Variables:** Create a `.env` file for API keys (see `.env.example`).
    *   `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`
    *   `LASTFM_API_KEY`

### Core Commands

| Task | Command | Description |
|------|---------|-------------|
| **Update Data** | `./update-playlists.sh` | **Most Common.** Parses `.txt` files in `archive/` and updates JSON. Run this after editing any playlist. |
| **Run Web App** | `cd web && npm run dev` | Starts the Vue development server at `http://localhost:5173`. |
| **Discover** | `./discover.sh` | Scrapes KCUR for new playlists and identifies gaps. |
| **Spotify Index** | `./index-spotify.sh` | Indexes tracks against Spotify API (slow). Run only when adding many new tracks. |

### Metadata Enrichment (Sequential)
To fully enrich the archive with artist images and bios:

1.  **Fetch Bios:** `node scripts/lastfm/fetch-artist-bios.js` (Requires Last.fm key)
2.  **Fetch Images:** `node scripts/spotify/enrich-artist-images.js` (Requires Spotify keys)
3.  **Consolidate:** `node scripts/consolidate-genres.js` (Merges tags/genres)

## Coding Conventions

### Playlist Files (`archive/txt/`)
*   **Filename:** `YYYY-MM-DD.txt`
*   **Format:** Typically `Artist - Song` or `Artist - "Song"`.
*   **Header:** Can include a title and description before the tracklist.

### Web Application (`web/src/`)
*   **Components:** Vue Single File Components (`.vue`) using `<script setup lang="ts">`.
*   **State:** Use Composables (`usePlaylists.ts`, etc.) for shared state logic (Singleton pattern).
*   **Styling:** Utility-first with Tailwind CSS. Avoid custom CSS unless necessary.
*   **Type Safety:** Strict TypeScript interfaces for all data models (Playlist, Track, Artist).

## Infrastructure
*   **Dockerized Scripts:** Python scripts run inside Docker containers (`cyprus-avenue-parser`, etc.) to ensure consistent dependencies without polluting the host machine.
*   **Netlify:** The web app is configured for Netlify deployment via `netlify.toml`.
