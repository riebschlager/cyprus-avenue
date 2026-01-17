# Built with Claude Code

This project was created entirely through a collaborative session with **Claude Code**, Anthropic's AI coding assistant. This document chronicles the development process and demonstrates Claude Code's capabilities in data extraction, parsing, and automation.

## Project Overview

**Goal**: Create a clean, structured archive of Cyprus Avenue radio show playlists from KCUR's website, preserving nearly 8 years of musical cultural heritage.

**Starting Point**: 119 unstructured `.txt` files from copy/pasting web content

**Final Result**: 125 playlists with 1,506 tracks in clean, searchable JSON format

## Development Process

### Phase 1: Data Normalization & Parsing

**Challenge**: Transform 119 inconsistent text files with varying formats into structured JSON.

**Claude Code Actions**:
1. Analyzed multiple `.txt` files to identify formatting patterns
2. Built a robust Python parser (`parse_playlists.py`) handling 6+ format variations:
   - "Artist - Song" with various dash types
   - "Artist - 'Song'" with quotes
   - Just "Song" for single-artist shows
   - "Artist, Album" for best-of lists
   - Numbered and bulleted lists
   - Various track list headers (Track List, Tracks, Tracklist, etc.)

3. Iteratively improved parser accuracy:
   - Initial parse: 1,080 tracks
   - After improvements: 1,439 tracks
   - **+359 tracks recovered** (33% improvement)

4. Created Docker environment for reproducible execution

**Key Files Created**:
- `scripts/parsing/parse_playlists.py` - Main parser with regex pattern matching
- `docker/Dockerfile.parse` - Containerized Python environment
- `json/individual/*.json` - 125 individual playlist files
- `json/playlists.json` - Consolidated database

### Phase 2: Web Discovery & Gap Analysis

**Challenge**: Identify what playlists exist on KCUR's website that weren't in the archive.

**Claude Code Actions**:
1. Built web scraper (`discover_playlists.py`) using BeautifulSoup
2. Implemented multiple pagination strategies:
   - Page number-based (`?page=N`)
   - Offset-based (`?offset=N&limit=M`)
   - Direct HTML link extraction

3. Created gap analysis comparing archive vs KCUR website
4. Generated detailed reports identifying missing content

**Key Discovery**:
- Archive was MORE complete than KCUR's website!
- Archive: 119 playlists (2009-2017)
- KCUR website: Only 7 visible playlists (2013-2015)
- Found 7 missing playlists to add

**Key Files Created**:
- `scripts/discovery/discover_playlists.py` - Web scraper with pagination
- `docker/Dockerfile.discover` - Discovery tool environment
- `data/discovered_playlists.json` - Found content
- `data/gap_analysis.json` - Missing playlist report

### Phase 3: Automated Collection

**Challenge**: Fetch missing playlists from KCUR and integrate into archive.

**Claude Code Actions**:
1. Built automated fetcher (`fetch_missing_playlists.py`)
2. Created HTML parser extracting:
   - Titles from page headers
   - Descriptions from article bodies
   - Track lists from various HTML structures (ul/ol lists, paragraphs)
   - Artist names from show titles for single-artist episodes

3. Enhanced parser with artist name inference for themed shows
4. When automated scraping had issues, used WebFetch tool to manually extract data
5. Successfully added 6 playlists (67 new tracks)

**Key Files Created**:
- `scripts/discovery/fetch_missing_playlists.py` - Playlist fetcher
- `docker/Dockerfile.fetch` - Fetcher environment
- 6 new JSON playlist files

### Phase 4: Spotify Integration

**Challenge**: Link archive tracks to Spotify for easy listening.

**Claude Code Actions**:
1. Created Spotify API integration (`scripts/spotify/index-spotify-tracks.js`)
2. Automated track indexing with confidence scoring
3. Successfully indexed 1,449 unique tracks (89.9% found on Spotify)
4. Generated JSON index mapping artist/song to Spotify URLs

**Key Files Created**:
- `scripts/spotify/index-spotify-tracks.js` - Spotify track indexer
- `scripts/spotify/README.md` - Spotify integration documentation
- `web/public/spotify-index.json` - Spotify track mapping

### Phase 5: Web Interface Development

**Challenge**: Create a modern, user-friendly web application to browse the archive with Vue 3.

**Claude Code Actions**:

1. **Project Setup & Architecture**
   - Scaffolded Vue 3 + TypeScript + Vite project
   - Configured Vue Router 4 with history mode
   - Set up Tailwind CSS for styling
   - Implemented responsive design for mobile/desktop

2. **Core Components** (18 Vue components created)
   - `HomePage.vue` - Landing page with archive overview and navigation
   - `PlaylistsView.vue` - Browse all playlists with search/filter
   - `PlaylistCard.vue` - Expandable playlist with tracks
   - `ArtistsViewWrapper.vue` - Browse by artist with auto-expand
   - `ArtistCard.vue` - Artist details with all appearances
   - `TracksViewWrapper.vue` - Searchable track listing
   - `TrackCard.vue` - Individual track display
   - `StreamingLinks.vue` - Multi-platform streaming dropdown
   - `App.vue` - Main app shell with sticky navigation

3. **State Management Patterns**
   - **Singleton Pattern**: Shared state in `usePlaylists.ts`
     - Single fetch across all route components
     - Prevents duplicate API calls
     - Maintains data across navigation

   - **Reactive Flexibility**: `MaybeRefOrGetter<T>` in composables
     - Works with both refs and plain values
     - Uses `toValue()` for reactive unwrapping
     - Enables proper reactivity on route changes

4. **Routing & Permalink System**
   - Slug-based URLs for SEO and sharing
   - Routes implemented:
     - `/` - Home page
     - `/playlists` - All playlists
     - `/playlist/:slug` - Individual playlist (e.g., `/playlist/2017-04-18`)
     - `/artists` - All artists
     - `/artist/:slug` - Individual artist (e.g., `/artist/bob-dylan`)
     - `/tracks` - All tracks searchable

   - URL slug generation with `generatePlaylistSlug()` and `generateArtistSlug()`
   - Auto-expand feature: URL changes when expanding cards
   - Deep linking: Share URLs that auto-expand specific content
   - Custom scroll behavior to maintain position during expand/collapse

5. **UI/UX Features**
   - **Sticky Header**: Compact mode on scroll
     - Transitions from py-6 to py-3
     - Font size reduces from text-3xl to text-xl
     - Navigation changes from tabs to pills
     - Smooth transitions with Tailwind classes

   - **Smart Scrolling**:
     - Custom scroll with 100px header offset
     - Auto-scroll to expanded cards on permalink load
     - Maintains scroll position during expand/collapse
     - Uses `getBoundingClientRect()` for precise positioning

   - **Dropdown Management**:
     - Singleton state in `useDropdownState.ts`
     - Only one dropdown open at a time
     - Auto-close when clicking outside
     - Watcher pattern for cross-component coordination

   - **Streaming Integration**:
     - Multi-platform support (Spotify, Apple Music, YouTube Music)
     - Direct Spotify links with ✓ indicator for indexed tracks
     - Fallback to search for non-indexed tracks
     - Lazy-loading of Spotify index (15-minute cache)

6. **Dynamic Page Titles**
   - Route-level meta titles
   - Dynamic updates based on content:
     - "Artist Name - Cyprus Avenue Archive"
     - "Playlist Title - Cyprus Avenue Archive"
   - Watchers in components for reactive title changes

7. **Search & Filter**
   - Real-time search across playlists, artists, and tracks
   - Sort by name (ascending/descending)
   - Track count display for artists
   - Responsive filtering with instant results

8. **Deployment**
   - Netlify configuration with SPA redirects
   - Build optimization with Vite
   - Public asset management for Spotify index
   - Environment-based routing

**Key Files Created**:
- `web/src/App.vue` - Main app with sticky header
- `web/src/router/index.ts` - Vue Router configuration
- `web/src/components/` - 18 Vue components
- `web/src/composables/` - 6 reusable composables
- `web/src/utils/` - Utility functions (slug generation)
- `web/src/types/` - TypeScript type definitions
- `web/netlify.toml` - Deployment configuration
- `web/vite.config.ts` - Build configuration
- `web/tailwind.config.js` - Styling configuration

**Composables Developed**:
- `usePlaylists.ts` - Singleton playlist data fetching
- `useArtists.ts` - Artist aggregation and sorting
- `useTracks.ts` - Track aggregation and sorting
- `useStreamingLinks.ts` - Spotify index and platform URLs
- `useDropdownState.ts` - Singleton dropdown management
- `useSearch.ts` - Search filtering logic

**Technical Challenges Solved**:

1. **Data Disappearing on Reload**
   - Problem: Passing `playlists.value` instead of `playlists` ref
   - Solution: `MaybeRefOrGetter<T>` pattern with `toValue()`
   - Ensures reactivity works across route changes

2. **Scroll Jumping on Expand**
   - Problem: Router navigation scrolled to top
   - Solution: Custom `scrollBehavior` checking component identity
   - Returns `false` to maintain position on same-component navigation

3. **Cards Hidden Under Sticky Header**
   - Problem: `scrollIntoView()` positioned at viewport top
   - Solution: Custom scroll calculation with 100px offset
   - Uses `getBoundingClientRect() + window.scrollTo()`

4. **Multiple Dropdowns Open Simultaneously**
   - Problem: Each dropdown managed own state independently
   - Solution: Singleton `currentOpenDropdownId` ref
   - Watchers auto-close dropdowns when another opens

5. **TypeScript Build Errors**
   - Problem: Type mismatches between components and composables
   - Solution: Proper interface definitions and type exports
   - `MaybeRefOrGetter<T>` for flexible parameter types

### Phase 6: Project Organization

**Challenge**: Root directory became cluttered with too many files as project grew.

**Claude Code Actions**:
1. Analyzed project structure and identified logical groupings
2. Created organized directory structure:
   - `scripts/parsing/` - Parser tools
   - `scripts/discovery/` - Web scraping and fetching
   - `scripts/spotify/` - Spotify integration
   - `docker/` - All Dockerfiles
   - `data/` - Generated analysis files
3. Moved all files using `git mv` to preserve history
4. Updated all file path references in:
   - Docker COPY commands
   - Python script outputs
   - Documentation (README.md, Spotify README)
5. Verified all paths and references remain functional

**Result**: Clean root directory with only documentation and organized subdirectories

### Phase 7: Spotify Playlist Creation & Optimization

**Challenge**: Enable users to create Spotify playlists directly from the archive with proper rate limiting and performance optimization.

**Claude Code Actions**:

1. **OAuth 2.0 Implementation**
   - Implemented client-side OAuth 2.0 PKCE flow (no backend required)
   - Session-based authentication with `sessionStorage` for temporary code verifier/state
   - Token exchange on `/auth/callback` route
   - Automatic redirect to Spotify authorization endpoint

2. **Spotify API Integration**
   - Built `SpotifyApiClient` factory function with methods:
     - `getCurrentUser()` - Fetch authenticated user info
     - `createPlaylist(userId, name, isPublic)` - Create playlist
     - `addTracksToPlaylist(playlistId, trackUris)` - Batch add tracks (100 per request)
     - `searchTrack(artist, song)` - Search for track by artist/song
   - Centralized error handling with meaningful error messages

3. **Track Matching System**
   - Created `TrackMatcher` with tiered matching strategy:
     - Level 1: Check pre-indexed Spotify tracks (high/medium confidence)
     - Level 2: Fallback to API search for unindexed tracks (individual playlists only)
     - Level 3: Mark as not found if no match available
   - Optimized mega-playlist creation with `skipApiSearch` parameter:
     - Skips API searches for Complete Archive playlist
     - Uses only pre-indexed tracks (88% coverage)
     - Reduces creation time from 4-5 minutes to 30-60 seconds

4. **Rate Limiting Strategy**
   - Sequential processing prevents concurrent request storms
   - Individual playlists: 150ms delay between track matches (protects API searches)
   - Mega-playlists: 1ms delay between matches (index lookups only)
   - 1000ms delay between batch additions (100 tracks per batch)
   - Respects Spotify's ~7 requests/second limit with conservative margins

5. **State Management**
   - Singleton composable `useSpotifyPlaylistCreation()` for shared state
   - Tracks creation state: idle → creating → completed/error
   - Real-time progress updates:
     - Current track index and count
     - Current artist and song name
     - Playlist name
   - Results reporting:
     - Tracks successfully added
     - Tracks not found with list of failures
     - Direct Spotify playlist URL

6. **User Interface Components**
   - `SpotifyAuthButton.vue` - OAuth login button
   - `SpotifyPlaylistModal.vue` - Modal dialog with dual modes:
     - Single playlist creation from individual shows
     - Complete archive mega-playlist (all unique tracks)
   - `PlaylistCreationProgress.vue` - Real-time progress indicator
   - `TrackMatchingSummary.vue` - Results display with warnings
   - `Toast.vue` / `ToastContainer.vue` - Notification system

7. **Features**
   - Two creation modes:
     - **Individual**: Create playlist from any archive show (e.g., "Cyprus Avenue - 2017-04-18")
     - **Complete Archive**: Single mega-playlist with all unique tracks (1,300+ tracks)
   - Pre-indexed track confidence indicators
   - Automatic track deduplication for mega-playlist
   - User-friendly warnings about unmatched tracks
   - Spotify icon (🎧) for visibility on dark backgrounds

**Key Files Created**:
- `web/src/utils/spotifyApi.ts` - SpotifyApiClient factory function
- `web/src/utils/spotifyConstants.ts` - OAuth configuration and constants
- `web/src/utils/trackMatching.ts` - TrackMatcher with skipApiSearch optimization
- `web/src/composables/useSpotifyAuth.ts` - OAuth flow and token management
- `web/src/composables/useSpotifyPlaylistCreation.ts` - Playlist creation logic
- `web/src/composables/useToast.ts` - Toast notification system
- `web/src/types/spotify.ts` - TypeScript interfaces for Spotify API
- `web/src/components/SpotifyAuthButton.vue` - Login button
- `web/src/components/SpotifyPlaylistModal.vue` - Creation modal
- `web/src/components/PlaylistCreationProgress.vue` - Progress indicator
- `web/src/components/TrackMatchingSummary.vue` - Results display
- `web/src/components/Toast.vue` - Individual notification
- `web/src/components/ToastContainer.vue` - Notification container
- `web/src/views/SpotifyCallback.vue` - OAuth callback handler

**Optimizations Implemented**:

1. **Rate Limiting Fix** (Commit: Sequential rate limiting)
   - Problem: `Promise.all()` fired concurrent requests during track matching
   - Solution: Sequential for-loops with per-track delays
   - Result: Eliminates rate limit errors for mega-playlists

2. **Mega-Playlist Performance** (Commit: Optimize mega-playlist creation)
   - Problem: Searching API for unindexed tracks (4-5 minutes total)
   - Solution: Skip API searches for Complete Archive, use index only
   - Result: 30-60 seconds for mega-playlist creation (88%+ coverage)

3. **Icon Visibility** (Commit: Replace musical note with headphones)
   - Problem: 🎵 musical note hard to see on dark backgrounds
   - Solution: Changed to 🎧 headphones emoji (better contrast)
   - Applies to: All Spotify links, buttons, and documentation

**Result**: Users can now create Spotify playlists in seconds without rate limiting errors, with individual playlists getting quality API fallbacks and mega-playlists optimized for speed.

### Phase 8: Artist Bios & Metadata Enrichment

**Challenge**: Enhance the archive with rich artist metadata including biographies, images, tags, and statistics.

**Claude Code Actions**:

1. **Last.fm API Integration**
   - Built `scripts/lastfm/fetch-artist-bios.js` to fetch artist data
   - Extracts biographies, tags, listener counts, and play statistics
   - Rate-limited requests (60/minute) to respect API limits
   - Cleans bio text by removing Last.fm footer links
   - Handles missing artists gracefully with error reporting

2. **Spotify Artist Image Enrichment**
   - Created `scripts/spotify/enrich-artist-images.js`
   - Last.fm no longer provides images (as of January 2025), so Spotify fills the gap
   - Fetches high-quality artist images (typically 640x640)
   - Adds Spotify artist ID, URL, popularity score, and follower count
   - Idempotent - skips artists that already have images
   - Achieved 99.6% image coverage (276/277 artists)

3. **Tag Consolidation System**
   - Built `scripts/consolidate-genres.js` to merge tags from multiple sources:
     - Last.fm tags (highest priority - most specific)
     - Spotify artist genres
     - Spotify track genres
   - Deduplicates using case-insensitive normalization
   - Preserves source attribution in `tagSources` field

4. **Tag Filtering & Normalization**
   - Created `web/src/utils/tagFilters.ts` for tag management
   - Case-insensitive blacklist for irrelevant tags (e.g., "seen live", "favourites")
   - Tag mappings to consolidate variants (e.g., "female vocalists" → "Female Vocalists")
   - Normalizes all tags to Title Case for display consistency
   - Alphabetical sorting for predictable display

5. **Artist Card Enhancements**
   - Updated `ArtistCard.vue` with rich metadata display:
     - Spotify artist images with fallback placeholder
     - Bio summary with link to full Last.fm page
     - Consolidated tags as clickable filters
     - Listener and play count statistics
     - Spotify artist link for direct profile access

6. **Tag-Based Artist Discovery**
   - Added tag filtering to Artists view
   - Click any tag to filter all artists with that tag
   - Active tag banner with clear filter option
   - Tag persists across page navigation via URL
   - Enables genre-based exploration of the archive

**Key Files Created**:
- `scripts/lastfm/fetch-artist-bios.js` - Last.fm bio fetcher
- `scripts/spotify/enrich-artist-images.js` - Spotify image enricher
- `scripts/consolidate-genres.js` - Multi-source tag merger
- `web/src/utils/tagFilters.ts` - Tag normalization and filtering
- `web/src/composables/useArtistBios.ts` - Artist bio data composable
- `web/public/artist-bios.json` - Consolidated artist metadata (~1.4 MB)

**Data Output Format**:
```json
{
  "Bob Dylan": {
    "bio": "Full biography from Last.fm...",
    "bioSummary": "Short summary for card display...",
    "tags": ["Rock", "Folk", "Singer-Songwriter"],
    "lastfmTags": ["rock", "folk", "singer-songwriter"],
    "tagSources": { "lastfm": 10, "spotifyArtist": 5, "spotifyTracks": 3, "total": 15 },
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

**Result**: Rich artist profiles with images, bios, and filterable tags enable music discovery beyond simple track listings.

### Phase 9: Spotify Web Player & Enhanced Playlist Modes

**Challenge**: Enable in-app music playback and expand Spotify playlist creation with artist and tag-based modes.

**Claude Code Actions**:

1. **Spotify Web Playback SDK Integration**
   - Created `SpotifyWebPlayer.vue` component for in-browser playback
   - Built `useSpotifyPlayback.ts` composable for player state management
   - Requires Spotify Premium for playback (Web Playback SDK limitation)
   - Real-time track information display (artist, song, album art)
   - Play/pause controls with state synchronization

2. **EQ Animation Visualization**
   - Added animated equalizer bars when music is playing
   - 7 bars with varying animation durations (0.8s - 1.4s)
   - Blue gradient color scheme matching app theme
   - Subtle glow effect for visual polish
   - CSS-only animation (no JavaScript overhead)

3. **Enhanced Spotify Playlist Modal**
   - Expanded from 2 modes to 4 playlist creation modes:
     - **Individual Show**: Create playlist from specific archive episode
     - **Complete Archive**: All unique tracks (~1,300+ tracks)
     - **By Artist**: All tracks by a specific artist across all shows
     - **By Tag**: All tracks by artists with a specific tag
   - Smart track deduplication across all modes
   - Mode-specific playlist naming conventions

4. **Artist-Based Playlist Creation**
   - Added "Create Spotify Playlist" button to ArtistCard
   - Collects all tracks by artist across entire archive
   - Handles artists appearing on multiple shows
   - Names playlist "Cyprus Avenue - [Artist Name]"

5. **Tag-Based Playlist Creation**
   - Added button when tag filter is active in Artists view
   - Collects all tracks by all artists matching the tag
   - Example: "Rock" tag → all tracks by rock artists
   - Names playlist "Cyprus Avenue - [Tag] Artists"
   - Powerful for genre-based playlist generation

6. **Home Page Enhancements**
   - "This Week in History" feature shows playlists from same date in past years
   - Smart date wrapping for December/January edge cases
   - "Suggested for You" section with random playlist and artist
   - Artist suggestion includes thumbnail and bio snippet
   - Dynamic refresh on each page load

7. **Improved Auth Flow**
   - Enhanced token refresh handling
   - Better error states and user feedback
   - Graceful degradation when not authenticated
   - Session persistence across page reloads

**Key Files Created/Modified**:
- `web/src/components/SpotifyWebPlayer.vue` - Music player with EQ animation
- `web/src/composables/useSpotifyPlayback.ts` - Playback state management
- `web/src/components/SpotifyPlaylistModal.vue` - Enhanced 4-mode modal
- `web/src/components/HomePage.vue` - This Week in History + Suggestions
- `web/src/components/ArtistCard.vue` - Artist playlist creation button

**Technical Challenges Solved**:

1. **Web Playback SDK Initialization**
   - Problem: SDK requires specific initialization timing
   - Solution: Dynamic script loading with ready callback
   - Handles player device registration with Spotify Connect

2. **Tag Filter URL Persistence**
   - Problem: Tag filter lost on page reload
   - Solution: Store active tag in URL query parameter
   - Restored on component mount via route query

3. **Date Wrapping for "This Week in History"**
   - Problem: January playlists should match December dates
   - Solution: Look for ±3 days accounting for year boundaries
   - Uses modular date arithmetic for edge cases

**Result**: Full-featured music application with in-browser playback, rich artist discovery, and flexible playlist creation spanning individual shows, complete archive, specific artists, and genre tags.

### Phase 10: MCP Server for LLM-Powered Music Discovery

**Challenge**: Expose the rich archive data through an MCP (Model Context Protocol) server, enabling LLM-powered natural language queries for music exploration and discovery.

**Claude Code Actions**:

1. **MCP Server Architecture**
   - Built TypeScript MCP server using `@modelcontextprotocol/sdk`
   - Implemented 21 tools across four categories
   - Designed read-only architecture for safe data exploration
   - Created dual-output format (Markdown + JSON) for artifact tools

2. **Core Query Tools (6 tools)**
   - `search_playlists` - Search by date range, title, description
   - `get_playlist` - Get full playlist with all tracks and Spotify links
   - `search_artists` - Search by name, bio content, or tags
   - `get_artist` - Detailed profile with appearances and stats
   - `search_tracks` - Search by artist, song name, or genre
   - `get_track` - Track details with Spotify data

3. **Discovery Tools (6 tools)**
   - `discover_by_tag` - Find artists/tracks by genre tags
   - `this_week_in_history` - Historical playlists from same week in past years
   - `similar_artists` - Tag-based similarity ranking
   - `random_discovery` - Serendipitous exploration
   - `find_artist_connections` - Co-occurrence network (who played alongside whom)
   - `suggest_by_mood_or_era` - Natural language mood/era to playlist matching

4. **Curation Analysis Tools (5 tools)**
   - `get_statistics` - Archive overview (125 playlists, 1,211 unique tracks, 304 artists)
   - `analyze_top_artists` - Most featured artists with dedicated shows
   - `analyze_genre_trends` - Genre evolution over time
   - `analyze_themes` - Thematic patterns (tributes, best-of, holiday specials)
   - `get_curation_summary` - Comprehensive Bill Shapiro curation analysis

5. **Artifact Generation Tools (4 tools)**
   - `generate_playlist_document` - Shareable playlist with Spotify links
   - `generate_artist_profile` - Comprehensive artist research document
   - `generate_discovery_report` - Themed music discovery by tags
   - `generate_year_in_review` - Annual summary with stats and trends

6. **Data Loading & Indexing**
   - Load all JSON data at startup (~2MB total)
   - Pre-computed indexes for fast queries:
     - Artist → playlist appearances
     - Tag → artists
     - Date → playlist
     - Co-occurrence matrix for artist connections

7. **Mood/Era Mapping System**
   - Mood keywords mapped to tags: "soulful" → [soul, classic soul, gospel, r&b]
   - Era keywords mapped to tags: "60s" → [60s, motown, british invasion, folk]
   - Auto-detection of query type with manual override

8. **Docker Integration**
   - `docker/Dockerfile.mcp` - Node.js 22 slim container
   - `mcp-server.sh` - Run script supporting both direct and Docker modes
   - Copies compiled JS and data files into container
   - stdio transport for MCP communication

**Key Files Created**:
- `mcp/src/index.ts` - MCP server entry point with 21 tool definitions
- `mcp/src/tools/search.ts` - Core query tool implementations
- `mcp/src/tools/discovery.ts` - Discovery tool implementations
- `mcp/src/tools/analysis.ts` - Curation analysis implementations
- `mcp/src/tools/artifacts.ts` - Artifact generation with dual output
- `mcp/src/data/loader.ts` - JSON loading and index building
- `mcp/src/data/tagMappings.ts` - Mood/era to tag mappings
- `mcp/src/utils/similarity.ts` - Tag similarity and connection scoring
- `mcp/src/utils/fuzzyMatch.ts` - Artist name fuzzy matching
- `mcp/src/utils/formatters.ts` - Markdown/JSON output formatters
- `mcp/src/types.ts` - TypeScript interfaces
- `mcp/package.json` - Dependencies (@modelcontextprotocol/sdk)
- `mcp/tsconfig.json` - TypeScript configuration
- `docker/Dockerfile.mcp` - Container definition
- `mcp-server.sh` - Run script

**Technical Challenges Solved**:

1. **Artist Connection Graph**
   - Problem: How to find artists who played together
   - Solution: Build co-occurrence matrix at startup from all playlists
   - Connection strength = (co-occurrences × 0.6) + (shared tags × 0.4)

2. **Natural Language Mood Mapping**
   - Problem: Convert "I want something soulful" to useful queries
   - Solution: Mood → tag mappings with match scoring
   - Playlists ranked by % of tracks with matching artist tags

3. **Fuzzy Artist Matching**
   - Problem: Users may not type exact artist names
   - Solution: Levenshtein distance with threshold + suggestions for failed matches

**Example Queries the MCP Server Enables**:
- "I like Bob Dylan, who else should I listen to?" → `find_artist_connections`
- "What were Bill Shapiro's favorite artists?" → `analyze_top_artists`
- "Create a document about blues music in the archive" → `generate_discovery_report`
- "What was playing this week in past years?" → `this_week_in_history`
- "I want something soulful for a rainy day" → `suggest_by_mood_or_era`

**Result**: LLM-powered music discovery interface enabling natural language exploration of 8 years of curated radio playlists, artist connections, and genre trends.

### Documentation & Polish

**Claude Code Actions**:
1. Created comprehensive `ARCHIVE_REPORT.md` with:
   - Archive statistics and metrics
   - Data quality analysis
   - Historical significance
   - Technical implementation details

2. Wrote professional `README.md` with:
   - Project description and background
   - Usage examples (Python & JavaScript)
   - Tool documentation
   - Docker commands

3. Generated this `CLAUDE.md` file documenting the AI-assisted development process

## Technical Highlights

### Docker-First Approach
Every tool runs in Docker containers for:
- Reproducible execution across machines
- Isolated Python environments
- No local dependency conflicts

### Robust Pattern Matching
Parser handles multiple edge cases:
```python
# Pattern examples from parse_playlists.py
r'^(.+?)\s*[-–—]\s*["\u201c](.+?)["\u201d]'  # Artist - "Song"
r'^(.+?)\s*[-–—]\s*(.+?)(?:\s+from\s+.+)?$'  # Artist - Song (no quotes)
r'^["\u201c](.+?)["\u201d]\s*$'              # Just "Song"
r'^(.+?),\s+(.+)$'                           # Artist, Album
```

### Iterative Improvement
Claude Code continuously refined the parser:
1. Initial simple patterns
2. Added case-insensitive header matching
3. Handled curly quotes and various dashes
4. Extracted artist from title for themed shows
5. Improved list item detection
6. Added fallback parsing strategies

### Data Validation
Every step validated results:
- Track counts per playlist
- Zero empty playlists check
- Date range verification
- Consolidated file regeneration

## Tools & Technologies

**Languages**:
- Python 3.11 - Data parsing and scraping
- TypeScript - Web application
- JavaScript - Spotify integration
- Bash - Automation scripts
- JSON - Data storage

**Backend Libraries**:
- `beautifulsoup4` - HTML parsing
- `requests` - HTTP fetching
- `re` - Pattern matching
- `pathlib` - File operations
- `spotify-web-api-node` - Spotify API client

**Frontend Stack**:
- Vue 3.4 - Composition API with `<script setup>`
- Vue Router 4 - Client-side routing
- TypeScript 5.3 - Type safety
- Vite 5 - Build tool and dev server
- Tailwind CSS 3 - Utility-first styling
- Heroicons - Icon library

**Infrastructure**:
- Docker - Containerized tooling
- Netlify - Web hosting and deployment

**AI Assistant**: Claude Code (Sonnet 4.5, Opus 4.5)

## Metrics

### Lines of Code Written

**Backend Scripts**:
- `scripts/parsing/parse_playlists.py`: ~200 lines
- `scripts/parsing/validate_playlists.py`: ~100 lines
- `scripts/discovery/discover_playlists.py`: ~180 lines
- `scripts/discovery/fetch_missing_playlists.py`: ~210 lines
- `scripts/spotify/index-spotify-tracks.js`: ~300 lines
- `scripts/spotify/recover-missing-tracks.js`: ~400 lines
- `scripts/spotify/enrich-artist-images.js`: ~200 lines
- `scripts/lastfm/fetch-artist-bios.js`: ~230 lines
- `scripts/consolidate-genres.js`: ~320 lines
- Total Python: ~690 lines
- Total JavaScript (scripts): ~1,450 lines

**Web Application**:
- Vue components: 17 files, ~3,500 lines
- Composables: 12 files, ~1,200 lines
- Router & utilities: 6 files, ~400 lines
- TypeScript types: ~200 lines
- Configuration files: ~150 lines
- Total TypeScript/Vue: ~5,450 lines

**MCP Server**:
- `mcp/src/index.ts`: ~400 lines (server entry + 21 tool definitions)
- `mcp/src/tools/*.ts`: ~1,500 lines (tool implementations)
- `mcp/src/data/*.ts`: ~350 lines (data loading, tag mappings)
- `mcp/src/utils/*.ts`: ~400 lines (similarity, fuzzy matching, formatters)
- `mcp/src/types.ts`: ~100 lines
- Total MCP TypeScript: ~2,750 lines

**Infrastructure & Config**:
- Dockerfiles: 4 files
- Vite/Tailwind/Netlify configs: ~200 lines
- Shell scripts: ~100 lines

**Documentation**:
- README.md: ~290 lines
- WORKFLOW.md: ~370 lines
- QUICKSTART.md: ~50 lines
- CLAUDE.md: ~980 lines
- Spotify README: ~360 lines
- Total documentation: ~2,050 lines

**Grand Total**: ~12,600 lines of code + documentation

### Development Time
Completed across multiple collaborative sessions, including:
- Planning and architecture
- Parser development and refinement
- Web scraping implementation
- Data fetching and integration
- Spotify API integration
- Web interface development
- Project reorganization
- MCP server design and implementation
- Full documentation

### Quality Metrics

**Data Processing**:
- **100% parsing success rate** (125/125 playlists)
- **0 empty playlists** (all contain valid track data)
- **33% improvement** in track extraction through iterations
- **6 missing playlists recovered** from KCUR
- **89.9% Spotify match rate** (1,302 of 1,449 unique tracks found)
- **88.3% high-confidence matches** on Spotify
- **99.6% artist image coverage** (276/277 artists from Spotify)
- **277+ unique artists** with metadata

**Web Application**:
- **17 Vue components** with TypeScript
- **12 composables** for reusable logic
- **7 routes** with deep linking support
- **4 main views**: Home, Playlists, Artists, Tracks
- **4 Spotify playlist modes**: Individual, Complete Archive, By Artist, By Tag
- **Multi-platform streaming** (Spotify, Apple Music, YouTube Music)
- **Spotify Web Player** for in-browser playback
- **Tag-based artist filtering** with normalized tags
- **100% TypeScript coverage** (no build errors)
- **Responsive design** (mobile & desktop)
- **Production deployed** on Netlify

## What Claude Code Did Well

1. **Pattern Recognition**: Quickly identified multiple text format variations across sample files

2. **Iterative Refinement**: Continuously improved parser based on results, recovering 359 missed tracks

3. **Problem Solving**: When automated scraping failed, pivoted to WebFetch tool for manual extraction

4. **Documentation**: Created comprehensive, professional documentation for future users

5. **Best Practices**:
   - Docker containers for reproducibility
   - Modular script design
   - Clear JSON schema
   - Git-friendly structure

6. **Attention to Detail**:
   - Preserved original files in archive
   - Both individual and consolidated formats
   - Proper Unicode handling for quotes/dashes
   - Consistent date formatting

7. **Project Organization**:
   - Recognized when structure needed improvement
   - Created logical directory organization
   - Preserved git history with `git mv`
   - Updated all references without breaking functionality

8. **Modern Web Development**:
   - Built production-ready Vue 3 application with TypeScript
   - Implemented advanced patterns (singleton state, reactive flexibility)
   - Solved complex UX challenges (scroll behavior, dropdown coordination)
   - Created responsive, accessible interface
   - Zero runtime errors or TypeScript warnings

9. **User Experience Focus**:
   - Sticky header with smooth transitions
   - Deep linking for sharing specific content
   - Smart scrolling that maintains context
   - Multi-platform streaming integration
   - Real-time search and filtering

## Lessons Learned

1. **Multiple format variations are common** in copy/pasted web content - robust parsing requires handling many edge cases

2. **Iterative development** leads to better results than trying to be perfect upfront

3. **Validation is crucial** - checking track counts revealed parsing issues that improved accuracy 33%

4. **Web scraping is unpredictable** - having fallback strategies (like manual WebFetch) is important

5. **Documentation matters** - well-documented projects are ready to share and maintain

6. **Refactor when needed** - as projects grow, taking time to reorganize improves maintainability

7. **Singleton patterns prevent duplicate work** - sharing state across components avoids redundant API calls and improves performance

8. **TypeScript catches bugs early** - type safety revealed issues before runtime and improved code quality

9. **UX details matter** - small touches like sticky headers, smart scrolling, and dropdown coordination significantly improve user experience

10. **Composition API scales well** - Vue 3's composables enable clean, reusable logic across components

11. **Sequential processing beats concurrent for rate limiting** - When APIs have rate limits, async/await with delays is more reliable than Promise.all()

12. **Index-first strategy optimizes performance** - Pre-indexed data (88% coverage) should be exploited fully before falling back to expensive operations like API searches

13. **Tiered matching strategies balance quality and speed** - High-confidence matches first, fallback searches second, graceful degradation third

14. **Icon choice affects usability** - Emoji selection matters for contrast and visibility on different backgrounds (🎧 over 🎵 on dark themes)

15. **Multi-source data enrichment adds value** - Combining Last.fm (bios, tags) with Spotify (images, genres) creates richer metadata than either source alone

16. **API changes require adaptation** - Last.fm stopped providing images in January 2025, requiring pivot to Spotify for artist images

17. **Tag normalization is essential** - Case-insensitive matching, blacklists, and mappings turn messy crowdsourced tags into usable filters

18. **URL state enables shareable filters** - Storing filter state (like active tag) in URL query params enables deep linking and browser back/forward

19. **Date edge cases need explicit handling** - "This Week in History" required special logic for December/January boundary dates

## Reproducibility

Every step can be reproduced:

```bash
# Phase 1: Parse existing text files
./update-playlists.sh
# or: docker build -f docker/Dockerfile.parse -t cyprus-avenue-parser . && docker run ...

# Phase 2: Discover available playlists
./discover.sh

# Phase 3: Fetch missing playlists
docker build -f docker/Dockerfile.fetch -t cyprus-avenue-fetch .
docker run --rm -v "$(pwd):/app" cyprus-avenue-fetch

# Phase 4: Index tracks with Spotify
./index-spotify.sh
# or: node scripts/spotify/index-spotify-tracks.js

# Phase 5: Build and run web interface
cd web
npm install
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build

# Phase 8: Enrich artist metadata
LASTFM_API_KEY=xxx node scripts/lastfm/fetch-artist-bios.js
node scripts/spotify/enrich-artist-images.js
node scripts/consolidate-genres.js

# Phase 10: Run MCP server
cd mcp && npm install && npm run build && cd ..
./mcp-server.sh                    # Direct Node.js mode
./mcp-server.sh --docker           # Docker mode
```

### Environment Variables

Create a `.env` file in the project root:

```bash
# Spotify API (required for indexing and web player)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# Last.fm API (required for artist bios)
LASTFM_API_KEY=your_api_key
```

## Impact

This project preserves:
- **125 playlists** spanning 7.5 years
- **1,506 tracks** across all genres
- **40+ years** of Bill Shapiro's musical curation
- **Kansas City's musical heritage** in structured, searchable format

Many of these playlists are no longer easily accessible on KCUR's website, making this archive a valuable cultural preservation effort.

## Realized & Future Possibilities

**Already Implemented**:
- ✓ Modern Vue 3 web interface with TypeScript
- ✓ Searchable archive across playlists, artists, and tracks
- ✓ Direct Spotify links for 89.9% of tracks with high-confidence indicator
- ✓ Multi-platform streaming (Spotify, Apple Music, YouTube Music)
- ✓ Permalink system for sharing specific playlists and artists
- ✓ Responsive design for mobile and desktop
- ✓ Dynamic page titles for SEO
- ✓ Sticky navigation with compact scroll mode
- ✓ Real-time search and filtering
- ✓ Smart scrolling with auto-expand for deep links
- ✓ Production deployment on Netlify
- ✓ One-click Spotify playlist creation from any archive show
- ✓ Complete Archive mega-playlist with all unique tracks
- ✓ Client-side OAuth 2.0 authentication (no backend required)
- ✓ Real-time progress tracking for playlist creation
- ✓ Rate-limiting and performance optimizations
- ✓ Toast notification system for user feedback
- ✓ **Artist bios and metadata from Last.fm API**
- ✓ **Artist images from Spotify (99.6% coverage)**
- ✓ **Consolidated tag system from multiple sources**
- ✓ **Tag-based artist filtering and discovery**
- ✓ **Spotify Web Player for in-browser playback**
- ✓ **EQ animation visualization during playback**
- ✓ **Artist-based Spotify playlist creation**
- ✓ **Tag-based Spotify playlist creation**
- ✓ **"This Week in History" feature on home page**
- ✓ **"Suggested for You" with random playlist/artist recommendations**
- ✓ **Interactive track recovery tool for missing Spotify matches**
- ✓ **MCP Server with 21 tools for LLM-powered music discovery**
- ✓ **Artist connection network (who played alongside whom)**
- ✓ **Mood/era-based playlist suggestions**
- ✓ **Curation analysis tools (top artists, genre trends, themes)**
- ✓ **Artifact generation (markdown + JSON documents)**

**Future Possibilities**:
- Creating collaborative Spotify/Apple Music playlists
- Adding user comments and favorites
- Social sharing features (Twitter cards, Open Graph)
- Export playlists to various formats
- Dark mode theme support
- Audio waveform visualization
- MCP-driven playlist generation across streaming platforms

---

**Project Started**: December 31, 2025

**Last Updated**: January 17, 2026

**AI Assistant**: Claude Code (Sonnet 4.5, Opus 4.5) by Anthropic

**Human Collaborator**: Project initiator and domain expert

*This file demonstrates how AI-assisted development can accelerate data preservation and create valuable cultural archives.*
