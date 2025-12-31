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

### Phase 4: Web Interface & Spotify Integration

**Challenge**: Create a user-friendly web interface to browse playlists and link tracks to Spotify.

**Claude Code Actions**:
1. Built modern web interface with playlist browsing and search
2. Created Spotify API integration (`scripts/spotify/index-spotify-tracks.js`)
3. Automated track indexing with confidence scoring
4. Successfully indexed 1,449 unique tracks (89.9% found on Spotify)

**Key Files Created**:
- `scripts/spotify/index-spotify-tracks.js` - Spotify track indexer
- `scripts/spotify/README.md` - Spotify integration documentation
- `web/` - Modern web interface for browsing archive
- `web/public/spotify-index.json` - Spotify track mapping

### Phase 5: Project Organization

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

**Languages**: Python 3.11, Bash, JSON

**Libraries**:
- `beautifulsoup4` - HTML parsing
- `requests` - HTTP fetching
- `re` - Pattern matching
- `pathlib` - File operations

**Infrastructure**: Docker

**AI Assistant**: Claude Code (Sonnet 4.5)

## Metrics

### Lines of Code Written
- `scripts/parsing/parse_playlists.py`: ~200 lines
- `scripts/discovery/discover_playlists.py`: ~180 lines
- `scripts/discovery/fetch_missing_playlists.py`: ~210 lines
- `scripts/spotify/index-spotify-tracks.js`: ~300 lines
- Total Python: ~590 lines
- Total JavaScript: ~300 lines
- Dockerfiles: 3 files
- Documentation: ~600 lines (README + ARCHIVE_REPORT + CLAUDE + Spotify README)

### Development Time
Completed across multiple collaborative sessions, including:
- Planning and architecture
- Parser development and refinement
- Web scraping implementation
- Data fetching and integration
- Spotify API integration
- Web interface development
- Project reorganization
- Full documentation

### Quality Metrics
- **100% parsing success rate** (125/125 playlists)
- **0 empty playlists** (all contain valid track data)
- **33% improvement** in track extraction through iterations
- **6 missing playlists recovered** from KCUR
- **89.9% Spotify match rate** (1,302 of 1,449 unique tracks found)
- **88.3% high-confidence matches** on Spotify

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

## Lessons Learned

1. **Multiple format variations are common** in copy/pasted web content - robust parsing requires handling many edge cases

2. **Iterative development** leads to better results than trying to be perfect upfront

3. **Validation is crucial** - checking track counts revealed parsing issues that improved accuracy 33%

4. **Web scraping is unpredictable** - having fallback strategies (like manual WebFetch) is important

5. **Documentation matters** - well-documented projects are ready to share and maintain

6. **Refactor when needed** - as projects grow, taking time to reorganize improves maintainability

## Reproducibility

Every step can be reproduced:

```bash
# Phase 1: Parse existing text files
docker build -f docker/Dockerfile.parse -t cyprus-avenue-parser .
docker run --rm -v "$(pwd)/archive/txt:/app/txt" -v "$(pwd)/json:/app/json" cyprus-avenue-parser

# Phase 2: Discover available playlists
docker build -f docker/Dockerfile.discover -t cyprus-avenue-discover .
docker run --rm -v "$(pwd):/app" cyprus-avenue-discover

# Phase 3: Fetch missing playlists
docker build -f docker/Dockerfile.fetch -t cyprus-avenue-fetch .
docker run --rm -v "$(pwd):/app" cyprus-avenue-fetch

# Phase 4: Index tracks with Spotify
SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/spotify/index-spotify-tracks.js
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
- ✓ Searchable web interface for browsing archive
- ✓ Direct Spotify links for 89.9% of tracks
- ✓ Playlist browsing with metadata and descriptions

**Future Possibilities**:
- Creating collaborative Spotify/Apple Music playlists
- Analyzing music trends and patterns over time
- Studying radio playlist curation techniques
- Exploring artist connections and relationships
- Generating music recommendations based on listening history
- Adding user comments and favorites
- Social sharing features

---

**Project Completed**: December 31, 2025

**AI Assistant**: Claude Code (Sonnet 4.5) by Anthropic

**Human Collaborator**: Project initiator and domain expert

*This file demonstrates how AI-assisted development can accelerate data preservation and create valuable cultural archives.*
