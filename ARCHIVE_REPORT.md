# Cyprus Avenue Playlist Archive Report

Generated: 2025-12-31

## Executive Summary

This archive contains **119 Cyprus Avenue playlists** from KCUR's legendary rock-and-roll radio show, hosted by Bill Shapiro for over 40 years. The archive spans from **2009-12-12 to 2017-07-14** and includes **1,439 tracks** across various genres.

## Archive Statistics

### Coverage
- **Total Playlists**: 119
- **Total Tracks**: 1,439
- **Average Tracks per Show**: 12.1
- **Date Range**: December 12, 2009 to July 14, 2017
- **Time Span**: ~7.5 years

### Data Quality
- **100% Success Rate**: All 119 playlists successfully parsed
- **Zero Empty Playlists**: All playlists contain extracted track data
- **Structured Format**: All data available in both individual JSON files and consolidated format

## Archive Contents

### File Structure
```
cyprus-avenue/
├── json/
│   ├── individual/          # 119 individual playlist JSON files
│   └── playlists.json       # Consolidated file with all playlists
├── archive/
│   └── txt/                 # 119 original copy/pasted text files
├── parse_playlists.py       # Parser script
├── discover_playlists.py    # Web discovery script
├── Dockerfile               # Parser Docker environment
└── Dockerfile.discover      # Discovery Docker environment
```

### JSON Schema
Each playlist follows this structure:
```json
{
  "date": "YYYY-MM-DD",
  "title": "Episode Title",
  "description": "Episode description...",
  "tracks": [
    {
      "artist": "Artist Name",
      "song": "Song Title"
    }
  ],
  "source_url": "https://www.kcur.org/tags/cyprus-avenue",
  "archived_date": "2025-12-31"
}
```

## Gap Analysis

### KCUR Website Comparison

We compared the archive against currently available content on KCUR.org:

**KCUR Currently Shows**: 12 Cyprus Avenue-related articles (7 music playlists)
**Date Range on KCUR**: June 22, 2013 to March 18, 2015

### Missing from Archive

We identified **7 playlists** available on KCUR that are not in this archive:

1. **2013-06-22** - Marty Stuart Redux
   - URL: https://www.kcur.org/music-shows/2013-06-22/marty-stuart-redux

2. **2013-06-29** - Rhythm To The Rhythms Vol III 2003-2004
   - URL: https://www.kcur.org/music-shows/2013-06-29/rhythm-to-the-rhythms-vol-iii-2003-2004

3. **2013-07-06** - Jimmy And Bob
   - URL: https://www.kcur.org/music-shows/2013-07-06/jimmy-and-bob

4. **2013-07-13** - Marty Stuart Redux Encore
   - URL: https://www.kcur.org/music-shows/2013-07-13/marty-stuart-redux-encore

5. **2013-08-10** - Ballads By Rockers Vol 2 (35th Anniversary Edition)
   - URL: https://www.kcur.org/music-shows/2013-08-10/ballads-by-rockers-vol-2-35th-anniversary-edition

6. **2014-02-01** - The Beatles 12 Greatest Hits
   - URL: https://www.kcur.org/arts-life/2014-02-01/the-beatles-12-greatest-hits

7. **2015-03-18** - Country Legend Marty Stuart Sings About Saturday Night/Sunday Morning
   - URL: https://www.kcur.org/show/up-to-date/2015-03-18/country-legend-marty-stuart-sings-about-saturday-night-sunday-morning

### Preserved Content

**Important**: This archive contains **100+ playlists from 2009-2017** that are no longer easily accessible on the KCUR website. This makes the archive extremely valuable for preserving this cultural and musical history.

## Parser Capabilities

The parser successfully handles:
- Multiple track list header variations (Track List, Tracks, Tracklist, etc.)
- Different artist-song separators (dashes, quotes, etc.)
- Artist-themed shows with just song titles
- Best-of lists with "Artist, Album" format
- Various formatting inconsistencies from copy/paste sources

## Technical Implementation

### Tools Used
- **Python 3.11** for all scripts
- **Docker** for reproducible execution environments
- **BeautifulSoup4** for web scraping
- **Regular expressions** for pattern matching and extraction

### Parsing Accuracy
Through iterative improvements:
- Initial parse: 1,080 tracks
- Final parse: 1,439 tracks
- **+359 tracks recovered** through parser enhancements (33% improvement)

## Future Recommendations

1. **Fetch Missing Playlists**: Download the 7 identified missing playlists to complete the 2013-2015 coverage

2. **Preservation Priority**: This archive is valuable because:
   - KCUR only shows a small subset of historical content
   - Many playlists from 2009-2012 and 2016-2017 are no longer on their website
   - Bill Shapiro passed away in 2020, ending the show's 40-year run

3. **Public Sharing**: Consider ways to share this data publicly:
   - Static website with searchable playlists
   - Spotify/Apple Music playlists recreation
   - Contribute to music history archives

4. **Additional Sources**: Check if there are other sources for Cyprus Avenue playlists:
   - Internet Archive / Wayback Machine
   - KCUR's internal archives
   - Fan communities or music forums

## About Cyprus Avenue

Cyprus Avenue was a legendary music radio show on KCUR 89.3 FM in Kansas City, hosted by Bill Shapiro from October 1978 until May 2018. The show covered "the world of popular music from gospel to rock - from country to reggae - from a different point of view."

Bill Shapiro, a Kansas City tax attorney by day and music enthusiast by night, curated unique playlists for over 40 years, introducing listeners to both classic and contemporary artists across all genres. He passed away in January 2020 at age 82.

---

*This archive represents an important preservation effort of Kansas City's musical cultural heritage.*
