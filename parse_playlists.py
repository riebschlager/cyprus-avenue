#!/usr/bin/env python3
"""
Parser for Cyprus Avenue playlist text files.
Converts raw copy/pasted text into structured JSON format.
"""

import re
import json
import os
from datetime import datetime
from pathlib import Path


def extract_date_from_filename(filename):
    """Extract date from filename like '2015-01-03.txt'"""
    match = re.match(r'(\d{4}-\d{2}-\d{2})\.txt', filename)
    if match:
        return match.group(1)
    return None


def parse_playlist_file(filepath):
    """Parse a single playlist text file into structured data"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.strip().split('\n')

    # Extract title (first non-empty line)
    title = lines[0].strip() if lines else ""

    # Extract description - typically appears after metadata and before track list
    description = ""
    description_started = False
    track_list_started = False

    # Look for common track list markers (case insensitive check)
    track_markers = [
        'track list:', 'track list',
        'tracks:', 'tracks list:', 'tracks',
        'tracklist:', 'tracklist',
        'playlist:', 'playlist'
    ]

    description_lines = []
    track_lines = []

    # Detect if this is a simple album list format (like 2009-12-12.txt)
    # These have no track list marker and just have "Artist, Album" on each line after title
    is_simple_album_list = False
    if len(lines) > 2:
        # Check if lines 2-5 all match "Artist, Album" pattern
        sample_lines = [l.strip() for l in lines[2:min(7, len(lines))] if l.strip() and not l.strip().startswith('By ')]
        if sample_lines and all(re.match(r'^[^,]+,\s+.+$', line) for line in sample_lines):
            is_simple_album_list = True
            track_list_started = True

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Skip title, metadata, and empty lines at the start
        if i == 0 or line.startswith('By ') or line in ['Cyprus Avenue', 'Tweet', 'Share', 'Google+', 'Email', '']:
            i += 1
            continue

        # For simple album lists, everything after title is tracks
        if is_simple_album_list and line:
            track_lines.append(line)
            i += 1
            continue

        # Check if we've hit the track list section (case insensitive)
        if any(marker in line.lower() for marker in track_markers):
            track_list_started = True
            i += 1
            continue

        # If we're in track list section, collect tracks
        if track_list_started:
            track_lines.append(line)
        # Otherwise, collect description
        elif not track_list_started and line and not line.startswith('CREDIT'):
            description_lines.append(line)

        i += 1

    description = ' '.join(description_lines).strip()

    # Parse tracks
    tracks = []
    for line in track_lines:
        line = line.strip()

        # Skip empty lines, credits, and section headers
        if not line or line.startswith('CREDIT') or line.startswith('Credit') or 'FLICKR' in line:
            continue

        # Strip leading numbers from numbered lists (e.g., "1. Artist, Album" -> "Artist, Album")
        line = re.sub(r'^\d+\.\s*', '', line)

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
            # Remove " from " and album info if present
            song = re.sub(r'\s+from\s+.+$', '', song).strip()
            tracks.append({"artist": artist, "song": song})
            continue

        # Pattern 3: "Song" from Album (for artist-themed shows)
        match = re.match(r'^["\u201c](.+?)["\u201d]\s+from\s+(.+)$', line)
        if match:
            song = match.group(1).strip()
            album = match.group(2).strip()
            # For these, extract artist from title if it's an artist-focused show
            artist = title if title else ""
            tracks.append({"artist": artist, "song": song})
            continue

        # Pattern 4: Just "Song" (for artist-themed shows like Prince)
        match = re.match(r'^["\u201c](.+?)["\u201d]\s*$', line)
        if match:
            song = match.group(1).strip()
            # Use the show title as the artist for single-artist shows
            artist = title if title else ""
            tracks.append({"artist": artist, "song": song})
            continue

        # Pattern 5: Artist, Album (year-end best-of lists)
        match = re.match(r'^(.+?),\s+(.+)$', line)
        if match and len(tracks) < 20:  # Likely a best-of album list
            artist = match.group(1).strip()
            album = match.group(2).strip()
            tracks.append({"artist": artist, "song": album})
            continue

        # Pattern 6: Just song title (no quotes, no artist - for artist-themed shows)
        # This catches simple song titles that don't match any other pattern
        if line and not line.startswith('By ') and len(line) > 3:
            # Use title as artist for single-artist shows
            tracks.append({"artist": title if title else "", "song": line})
            continue

    # Get date from filename
    filename = os.path.basename(filepath)
    date = extract_date_from_filename(filename)

    # Build the playlist object
    playlist = {
        "date": date,
        "title": title,
        "description": description,
        "tracks": tracks,
        "source_url": f"https://www.kcur.org/tags/cyprus-avenue",  # Generic for now
        "archived_date": datetime.now().strftime("%Y-%m-%d")
    }

    return playlist


def parse_all_playlists(txt_dir, output_dir):
    """Parse all playlist files and convert to JSON"""
    txt_path = Path(txt_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    all_playlists = []

    # Get all .txt files
    txt_files = sorted(txt_path.glob('*.txt'))

    print(f"Found {len(txt_files)} playlist files to parse...")

    for txt_file in txt_files:
        try:
            print(f"Parsing {txt_file.name}...", end=' ')
            playlist = parse_playlist_file(txt_file)

            # Save individual JSON file
            json_filename = txt_file.stem + '.json'
            json_filepath = output_path / json_filename

            with open(json_filepath, 'w', encoding='utf-8') as f:
                json.dump(playlist, f, indent=2, ensure_ascii=False)

            all_playlists.append(playlist)
            print(f"✓ ({len(playlist['tracks'])} tracks)")

        except Exception as e:
            print(f"✗ Error: {e}")

    # Sort all playlists by date
    all_playlists.sort(key=lambda x: x['date'] if x['date'] else '0000-00-00')

    return all_playlists


def main():
    """Main execution function"""
    # Paths
    txt_dir = 'txt'
    individual_json_dir = 'json/individual'
    consolidated_json_path = 'json/playlists.json'

    # Parse all playlists
    all_playlists = parse_all_playlists(txt_dir, individual_json_dir)

    # Create consolidated JSON
    os.makedirs('json', exist_ok=True)
    with open(consolidated_json_path, 'w', encoding='utf-8') as f:
        json.dump(all_playlists, f, indent=2, ensure_ascii=False)

    # Print summary
    print(f"\n{'='*60}")
    print(f"Parsing complete!")
    print(f"{'='*60}")
    print(f"Total playlists parsed: {len(all_playlists)}")
    print(f"Individual JSON files: {individual_json_dir}/")
    print(f"Consolidated JSON: {consolidated_json_path}")

    # Calculate some stats
    total_tracks = sum(len(p['tracks']) for p in all_playlists)
    avg_tracks = total_tracks / len(all_playlists) if all_playlists else 0

    print(f"\nStatistics:")
    print(f"  Total tracks: {total_tracks}")
    print(f"  Average tracks per show: {avg_tracks:.1f}")
    print(f"  Date range: {all_playlists[0]['date']} to {all_playlists[-1]['date']}")


if __name__ == '__main__':
    main()
