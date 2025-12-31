#!/usr/bin/env python3
"""
Automated scraper to fetch missing Cyprus Avenue playlists from KCUR.
Downloads playlist pages, extracts content, and adds to archive.
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
from pathlib import Path
import time


def fetch_playlist_page(url):
    """Fetch a single playlist page from KCUR"""
    print(f"Fetching {url}...")

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"  Error fetching page: {e}")
        return None


def extract_playlist_from_html(html_content, url):
    """Extract playlist information from HTML"""
    soup = BeautifulSoup(html_content, 'html.parser')

    # Extract title - usually in h1 or article title
    title = ""
    title_elem = soup.find('h1') or soup.find('h2', class_=re.compile('title|headline'))
    if title_elem:
        title = title_elem.get_text(strip=True)

    # Extract date from URL
    date_match = re.search(r'/(\d{4})-(\d{2})-(\d{2})/', url)
    date = date_match.group(0)[1:-1] if date_match else None

    # Extract description/article content
    description = ""
    # Look for article body or main content
    article_body = soup.find('div', class_=re.compile('article-body|content|description|body'))
    if article_body:
        # Get text but exclude certain elements
        for script in article_body(['script', 'style', 'nav', 'header', 'footer']):
            script.decompose()
        description = article_body.get_text(separator=' ', strip=True)

    # Extract tracks - look for various list patterns
    tracks = []

    # Strategy 1: Look for track list sections
    track_section = None
    for header in soup.find_all(['h2', 'h3', 'h4', 'strong', 'b']):
        header_text = header.get_text(strip=True).lower()
        if any(marker in header_text for marker in ['track list', 'tracks', 'playlist', 'songs']):
            # Found a track list header, get content after it
            track_section = header.find_next_sibling()
            break

    # Strategy 2: Look for lists (ul/ol) that might contain tracks
    if not track_section:
        lists = soup.find_all(['ul', 'ol'])
        for lst in lists:
            items = lst.find_all('li')
            if len(items) >= 3:  # At least 3 items suggests a track list
                track_section = lst
                break

    # Strategy 3: Look for content with track-like patterns
    if not track_section and article_body:
        track_section = article_body

    # Determine likely artist from title for single-artist shows
    # Extract artist name from title (e.g., "The Beatles' 12 Greatest Hits" -> "The Beatles")
    title_artist = None
    artist_patterns = [
        r'^(.+?)\'s?\s+\d+\s+(?:Greatest Hits|Best|Favorites)',  # "Artist's 12 Greatest Hits"
        r'^(.+?)\s+[-–—]',  # "Artist -- Title"
        r'^(.+?)\s+Redux',  # "Artist Redux"
    ]
    for pattern in artist_patterns:
        match = re.match(pattern, title, re.IGNORECASE)
        if match:
            title_artist = match.group(1).strip()
            break

    # Parse tracks from the section
    if track_section:
        # Try to extract from list items first (better structure)
        list_items = track_section.find_all('li')
        lines_to_parse = []

        if list_items and len(list_items) >= 3:
            for item in list_items:
                line = item.get_text(strip=True)
                if line and len(line) >= 5:
                    lines_to_parse.append(line)
        else:
            # Fall back to text splitting
            text_content = track_section.get_text(separator='\n', strip=True)
            lines_to_parse = [l.strip() for l in text_content.split('\n') if l.strip() and len(l.strip()) >= 5]

        for line in lines_to_parse:

            # Skip common non-track lines
            if any(skip in line.lower() for skip in ['credit', 'photo', 'image', 'listen', 'share', 'tweet']):
                continue

            # Try to parse artist - song patterns
            # Pattern 1: Artist - "Song"
            match = re.match(r'^(.+?)\s*[-–—]\s*["\u201c](.+?)["\u201d]', line)
            if match:
                artist = match.group(1).strip()
                song = match.group(2).strip()
                tracks.append({"artist": artist, "song": song})
                continue

            # Pattern 2: Artist - Song (no quotes)
            match = re.match(r'^(.+?)\s*[-–—]\s*(.+?)(?:\s+from\s+.+)?$', line)
            if match:
                artist = match.group(1).strip()
                song = match.group(2).strip()
                song = re.sub(r'\s+from\s+.+$', '', song).strip()
                # Avoid false positives (headers, metadata, etc.)
                if len(artist) < 50 and len(song) < 100:
                    tracks.append({"artist": artist, "song": song})
                continue

            # Pattern 3: Just "Song" (for single-artist shows)
            match = re.match(r'^["\u201c](.+?)["\u201d]', line)
            if match:
                song = match.group(1).strip()
                artist = title_artist if title_artist else title
                tracks.append({"artist": artist, "song": song})
                continue

            # Pattern 3b: Just "Song" without quotes at start of line
            if line.startswith('"') or re.match(r'^\d+\.\s*"', line):
                # Remove numbering if present
                song = re.sub(r'^\d+\.\s*', '', line).strip()
                # Strip various quote characters
                for quote_char in ['"', "'", '"', '"', ''', ''']:
                    song = song.strip(quote_char)
                if song:
                    artist = title_artist if title_artist else title
                    tracks.append({"artist": artist, "song": song})
                continue

            # Pattern 4: Artist, Album
            match = re.match(r'^(.+?),\s+(.+)$', line)
            if match and len(tracks) < 20:
                artist = match.group(1).strip()
                album = match.group(2).strip()
                if len(artist) < 50 and len(album) < 100:
                    tracks.append({"artist": artist, "song": album})
                continue

    return {
        "date": date,
        "title": title,
        "description": description[:500] if description else "",  # Limit description length
        "tracks": tracks,
        "source_url": url,
        "archived_date": datetime.now().strftime("%Y-%m-%d")
    }


def save_playlist(playlist_data, output_dir='json/individual', raw_dir='archive/txt'):
    """Save playlist as JSON and optionally save raw content"""
    # Create directories
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    Path(raw_dir).mkdir(parents=True, exist_ok=True)

    date = playlist_data['date']
    if not date:
        print("  Warning: No date found, skipping save")
        return False

    # Save individual JSON
    json_path = Path(output_dir) / f"{date}.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(playlist_data, f, indent=2, ensure_ascii=False)

    print(f"  ✓ Saved {json_path} ({len(playlist_data['tracks'])} tracks)")
    return True


def update_consolidated_json(json_dir='json/individual', output_file='json/playlists.json'):
    """Rebuild the consolidated playlists.json file"""
    json_path = Path(json_dir)
    all_playlists = []

    for json_file in json_path.glob('*.json'):
        with open(json_file, 'r', encoding='utf-8') as f:
            playlist = json.load(f)
            all_playlists.append(playlist)

    # Sort by date
    all_playlists.sort(key=lambda x: x['date'] if x['date'] else '0000-00-00')

    # Save consolidated file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_playlists, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Updated consolidated file: {output_file}")
    print(f"  Total playlists: {len(all_playlists)}")


def main():
    """Main execution"""
    print("Cyprus Avenue Missing Playlist Fetcher")
    print("=" * 70)

    # Load gap analysis to get missing playlists
    try:
        with open('gap_analysis.json', 'r') as f:
            gap_data = json.load(f)
            missing_playlists = gap_data.get('missing', [])
    except FileNotFoundError:
        print("Error: gap_analysis.json not found. Run discover_playlists.py first.")
        return

    if not missing_playlists:
        print("No missing playlists found!")
        return

    print(f"Found {len(missing_playlists)} missing playlists to fetch\n")

    fetched = 0
    failed = 0

    for i, playlist_info in enumerate(missing_playlists, 1):
        url = playlist_info['url']
        date = playlist_info['date']
        title = playlist_info['title']

        print(f"\n[{i}/{len(missing_playlists)}] {date} - {title}")

        # Fetch page
        html_content = fetch_playlist_page(url)
        if not html_content:
            failed += 1
            continue

        # Extract playlist data
        playlist_data = extract_playlist_from_html(html_content, url)

        # Save playlist
        if save_playlist(playlist_data):
            fetched += 1
        else:
            failed += 1

        # Be nice to the server
        if i < len(missing_playlists):
            time.sleep(1)

    # Update consolidated JSON
    if fetched > 0:
        update_consolidated_json()

    # Summary
    print(f"\n{'=' * 70}")
    print(f"Fetch Summary")
    print(f"{'=' * 70}")
    print(f"Successfully fetched: {fetched}")
    print(f"Failed: {failed}")
    print(f"\nArchive now contains {119 + fetched} playlists")


if __name__ == '__main__':
    main()
