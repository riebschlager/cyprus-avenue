#!/usr/bin/env python3
"""
Parser for Cyprus Avenue playlist text files.
Converts raw copy/pasted text into structured JSON format.
"""

import re
import json
import os
import argparse
import tempfile
from datetime import date
from pathlib import Path


def extract_date_from_filename(filename):
    """Extract date from filename like '2015-01-03.txt'"""
    match = re.match(r'(\d{4}-\d{2}-\d{2})\.txt', filename)
    if match:
        return match.group(1)
    return None


def extract_artist_from_title_and_description(title, description):
    """Extract artist name from show titles and descriptions"""
    if not title:
        return title

    # First, try to extract from description if it explicitly mentions an artist
    # Pattern: "The legendary Artist Name" or "Artist Name is back" or "Singer-songwriter Artist Name's"
    if description:
        desc_patterns = [
            r'[\u201c"][^""\u201d]+,[\u201d"]\s+the\s+(?:iconic|legendary)\s+([A-Z][a-zA-Z\s\.&]+?)(?:\.|,|$)',  # "old blue eyes," the iconic Frank Sinatra
            r'[\u201c"][^""\u201d]+,[\u201d"]\s+([A-Z][a-zA-Z\s\.&]+?)(?:\s+through|\s+is|\s+has)',  # "The Boss," Bruce Springsteen
            r'(?:The legendary|Legendary)\s+([A-Z][a-zA-Z\s\.&]+?)(?:\s+is|\s+has|\s+was)',
            r'(?:The great|great)\s+([A-Z][a-zA-Z\s\.&]+?)(?:\s+got|\s+is|\s+has|\s+was|\s+with)',  # "The great Jimi Hendrix" or "the great Bob Marley with"
            r'(?:genius|talent)\s+of\s+([A-Z][a-zA-Z\s\.&]+?)(?:,|\s+has|\s+is|\s+was)',  # "genius of Ray Charles," or "genius of Van Morrison has"
            r'the music of\s+([A-Z][a-zA-Z\s\.&]+?)(?:\s+inspired|\s+is|\s+on)',  # "the music of Sly and the Family Stone"
            r'It\'s\s+([A-Z][a-zA-Z\s\.&]+?)\s+on\s+this\s+edition',  # "It's Sly and the Family Stone on this edition"
            r'^([A-Z][a-zA-Z\s\.&]+?)\s+is back',
            r'(?:Singer-songwriter|Singer/songwriter)\s+([A-Z][a-zA-Z\s\.&]+?)(?:\'s|\s+is|\s+has)',
            r'Singer\s+([A-Z][a-zA-Z\s\.&]+?)(?:,|\s+just|\s+is|\s+has|\s+was)',  # "Singer Van Morrison," or "Singer Aaron Neville just"
        ]
        for pattern in desc_patterns:
            match = re.search(pattern, description)
            if match:
                artist = match.group(1).strip()
                # Clean up trailing words
                artist = re.sub(r'\s+(is|has|was|got)$', '', artist)
                return artist

    # Pattern: "Artist Name YYYY-YYYY" - extract artist before date range
    match = re.match(r'^([A-Z][a-zA-Z\s\.&]+?)\s+\d{4}\s*[-–—]\s*\d{4}$', title)
    if match:
        return match.group(1).strip()

    # Pattern: "Artist Name- Album Name" or "Artist Name: Album Name" - extract artist before separator
    match = re.match(r'^([A-Z][a-zA-Z\s\.&]+?)[-:]\s+.+$', title)
    if match:
        return match.group(1).strip()

    # Pattern: "Here Comes Artist Name" or "Here's Artist Name"
    match = re.match(r'^(?:Here Comes?|Here\'s)\s+(.+)$', title, re.IGNORECASE)
    if match:
        return match.group(1).strip()

    # Pattern: "Artist Name Returns" or "Artist Name Redux" or "Artist Name Encore"
    match = re.match(r'^(.+?)\s+(?:Returns|Redux|Encore)$', title, re.IGNORECASE)
    if match:
        return match.group(1).strip()

    # Pattern: "Artist Name Playlist" or "Artist Name's Playlist"
    match = re.match(r'^(.+?)(?:\'s)?\s+Playlist$', title, re.IGNORECASE)
    if match:
        return match.group(1).strip()

    # Pattern: "Remembering Artist Name"
    match = re.match(r'^Remembering\s+(.+)$', title, re.IGNORECASE)
    if match:
        return match.group(1).strip()

    # Default: return the title as-is
    return title


def clean_song_title(song):
    """Strip any non-alpha or non-digit characters from the beginning of a song title."""
    if not song:
        return song
    return re.sub(r'^[^a-zA-Z0-9]+', '', song).strip()


def parse_playlist_file(filepath, archived_date=None):
    """Parse a single playlist text file into structured data"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.strip().split('\n')

    # Extract title (first non-empty line)
    title = lines[0].strip() if lines else ""
    
    # Ensure any dash in the title has a space on either side
    title = re.sub(r'\s*[-–—]\s*', ' - ', title)

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
        # Pattern 0: Artist: "Song" (colon separator with quotes)
        match = re.match(r'^(.+?):\s*["\u201c](.+?)["\u201d]', line)
        if match:
            artist = match.group(1).strip()
            song = clean_song_title(match.group(2))
            tracks.append({"artist": artist, "song": song})
            continue

        # Pattern 1: Artist - "Song"
        match = re.match(r'^(.+?)\s*[-–—]\s*["\u201c](.+?)["\u201d]', line)
        if match:
            artist = match.group(1).strip()
            song = clean_song_title(match.group(2))
            tracks.append({"artist": artist, "song": song})
            continue

        # Pattern 1b: "Song" - Artist (reversed format)
        match = re.match(r'^["\u201c](.+?)["\u201d]\s*[-–—]\s*(.+)$', line)
        if match:
            song = clean_song_title(match.group(1))
            artist = match.group(2).strip()
            tracks.append({"artist": artist, "song": song})
            continue

        # Pattern 1c: - "Song" (leading dash without artist, for continuation lists)
        match = re.match(r'^[-–—]\s*["\u201c](.+?)["\u201d]\s*$', line)
        if match:
            song = clean_song_title(match.group(1))
            # Extract artist from title/description for single-artist shows
            artist = extract_artist_from_title_and_description(title, description)
            tracks.append({"artist": artist, "song": song})
            continue

        # Pattern 2: "Song" from Album (for artist-themed shows)
        match = re.match(r'^["\u201c](.+?)["\u201d]\s+from\s+(.+)$', line)
        if match:
            song = clean_song_title(match.group(1))
            album = match.group(2).strip()
            # Extract artist from title/description for single-artist shows
            artist = extract_artist_from_title_and_description(title, description)
            tracks.append({"artist": artist, "song": song})
            continue

        # Pattern 3: Just "Song" (for artist-themed shows like Prince)
        # Also handles "Song" (with collaborator) format
        # IMPORTANT: Check this BEFORE Pattern 4 (Artist - Song) to avoid misinterpreting
        # dashes within quoted song titles (e.g., "Ghost Train Four-Oh-Ten")
        match = re.match(r'^["\u201c](.+?)["\u201d](?:\s*\(.*\))?\s*(?:\d+:\d+)?\s*$', line)
        if match:
            song = clean_song_title(match.group(1))
            # Strip any trailing track duration (e.g., "4:10") that might have been included
            song = re.sub(r'\s+\d+:\d+\s*$', '', song).strip()
            # Extract artist from title/description for single-artist shows
            artist = extract_artist_from_title_and_description(title, description)
            tracks.append({"artist": artist, "song": song})
            continue

        # Pattern 4: Artist - Song (no quotes)
        match = re.match(r'^(.+?)\s*[-–—]\s*(.+?)(?:\s+from\s+.+)?$', line)
        if match:
            artist = match.group(1).strip()
            song = clean_song_title(match.group(2))
            # Remove " from " and album info if present
            song = re.sub(r'\s+from\s+.+$', '', song).strip()
            tracks.append({"artist": artist, "song": song})
            continue

        # Pattern 5: Artist, Album (year-end best-of lists)
        match = re.match(r'^(.+?),\s+(.+)$', line)
        if match and len(tracks) < 20:  # Likely a best-of album list
            artist = match.group(1).strip()
            album = clean_song_title(match.group(2))
            tracks.append({"artist": artist, "song": album})
            continue

        # Pattern 6: Artist [multiple spaces] Song (whitespace-separated format)
        # Match lines with 5+ consecutive spaces separating artist and song
        match = re.match(r'^([A-Z][a-zA-Z\s\.&]+?)\s{5,}(.+)$', line)
        if match:
            artist = match.group(1).strip()
            song = clean_song_title(match.group(2))
            tracks.append({"artist": artist, "song": song})
            continue

        # Pattern 7: Just song title (no quotes, no artist - for artist-themed shows)
        # This catches simple song titles that don't match any other pattern
        if line and not line.startswith('By ') and len(line) > 3:
            # Skip lines that are likely photo credits or standalone artist names
            # These are short lines with no track indicators (dashes, quotes, commas, "from")
            has_track_indicators = (
                '-' in line or '–' in line or '—' in line or  # dashes
                '"' in line or '\u201c' in line or '\u201d' in line or  # quotes
                ', ' in line or  # comma-space (Artist, Album pattern)
                ' from ' in line.lower()  # "from" keyword
            )

            # If line is short (<30 chars) and has no track indicators, skip it
            # This filters out standalone names like "Sam Baker" that are photo credits
            if len(line) < 30 and not has_track_indicators:
                continue

            # Extract artist from title/description for single-artist shows
            artist = extract_artist_from_title_and_description(title, description)
            tracks.append({"artist": artist, "song": clean_song_title(line)})
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
        "archived_date": archived_date
    }

    return playlist


REPO_ROOT = Path(__file__).resolve().parents[2]


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def require_date(value):
    if not isinstance(value, str) or date.fromisoformat(value).isoformat() != value:
        raise ValueError(f"Invalid ISO date: {value!r}")


def validate_records(playlists):
    if not isinstance(playlists, list) or not playlists:
        raise ValueError("Expected a nonempty playlist list")
    seen = set()
    for playlist in playlists:
        require_date(playlist['date'])
        require_date(playlist['archived_date'])
        if playlist['date'] in seen:
            raise ValueError(f"Duplicate show: {playlist['date']}")
        seen.add(playlist['date'])
        for field in ('title', 'description', 'source_url'):
            if not isinstance(playlist[field], str) or (field != 'description' and not playlist[field].strip()):
                raise ValueError(f"{playlist['date']}: invalid {field}")
        if not isinstance(playlist['tracks'], list) or not playlist['tracks']:
            raise ValueError(f"{playlist['date']}: no tracks")
        for track in playlist['tracks']:
            for field in ('artist', 'song'):
                if not isinstance(track[field], str) or not track[field].strip():
                    raise ValueError(f"{playlist['date']}: invalid track {field}")


def assemble_playlists(root=REPO_ROOT):
    """Read only declared inputs. Never recover records from export directories."""
    root = Path(root)
    source = root / 'data/source'
    archived_dates = read_json(source / 'archived-dates.json')
    playlists = []
    text_files = sorted((root / 'archive/txt').glob('*.txt'))
    if not text_files:
        raise ValueError("No text sources found")
    for txt in text_files:
        # New sources must declare their archival date explicitly.
        playlists.append(parse_playlist_file(txt, archived_dates[txt.stem]))
    for imported in sorted((source / 'imported-playlists').glob('*.json')):
        record = read_json(imported)
        if imported.stem != record['date']:
            raise ValueError(f"Imported filename/date mismatch: {imported}")
        playlists.append(record)
    validate_records(playlists)
    corrections = read_json(source / 'corrections.json')
    if not isinstance(corrections, list):
        raise ValueError("corrections.json must be a list")
    for correction in corrections:
        original, replacement = correction['from'], correction['to']
        if correction.get('date'):
            require_date(correction['date'])
        for field in ('artist', 'song'):
            if not isinstance(original[field], str) or not isinstance(replacement[field], str):
                raise ValueError("Corrections require artist/song pairs")
        matches = 0
        for playlist in playlists:
            if correction.get('date') and playlist['date'] != correction['date']:
                continue
            for track in playlist['tracks']:
                if all(track[k] == original[k] for k in ('artist', 'song')):
                    track.update({field: replacement[field] for field in ('artist', 'song')})
                    matches += 1
        if not matches:
            raise ValueError(f"Correction no longer matches any source: {correction}")
    playlists.sort(key=lambda p: p['date'])
    validate_records(playlists)
    return playlists


def assemble_metadata(root=REPO_ROOT):
    source = Path(root) / 'data/source'
    bios = read_json(source / 'metadata/artist-bios.json')
    index = read_json(source / 'metadata/spotify-index.json')
    overrides = read_json(source / 'spotify-overrides.json')
    if not all(isinstance(obj, dict) for obj in (bios, index, overrides)):
        raise ValueError("Metadata and overrides must be objects")
    index.update(overrides)
    for key, entry in index.items():
        if not isinstance(entry, dict) or not isinstance(entry.get('spotifyUrl'), str) or not entry['spotifyUrl'].startswith('https://open.spotify.com/track/'):
            raise ValueError(f"Invalid Spotify mapping: {key}")
    for artist, bio in bios.items():
        if not isinstance(bio, dict):
            raise ValueError(f"Invalid biography: {artist}")
        for field in ('tags', 'lastfmTags'):
            if field in bio and (not isinstance(bio[field], list) or
                                 not all(isinstance(tag, str) for tag in bio[field])):
                raise ValueError(f"Invalid {field}: {artist}")
    return {'artist-bios.json': bios, 'spotify-index.json': index}


def publish_json(outputs):
    """Serialize and stage every file before replacing any validated export."""
    staged = []
    try:
        for target, value in outputs.items():
            encoded = json.dumps(value, indent=2, ensure_ascii=False)
            target.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=target.parent,
                                             prefix='.' + target.name, delete=False) as handle:
                staged.append((Path(handle.name), target))
                handle.write(encoded)
        for temporary, target in staged:
            os.replace(temporary, target)
    finally:
        for temporary, _ in staged:
            temporary.unlink(missing_ok=True)


def build(root=REPO_ROOT, output_root=None):
    root = Path(root)
    output_root = Path(output_root) if output_root else root
    playlists = assemble_playlists(root)
    metadata = assemble_metadata(root)
    individual = output_root / 'json/individual'
    outputs = {individual / (p['date'] + '.json'): p for p in playlists}
    outputs[output_root / 'json/playlists.json'] = playlists
    outputs[output_root / 'web/public/playlists.json'] = playlists
    for filename, value in metadata.items():
        outputs[output_root / 'web/public' / filename] = value
    publish_json(outputs)
    # A deleted source must not be resurrected by a stale individual export.
    for stale in individual.glob('*.json'):
        if stale not in outputs:
            stale.unlink()
    return playlists


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=REPO_ROOT, help='Repository input root')
    parser.add_argument('--output-root', type=Path, help='Export to a separate clean directory')
    args = parser.parse_args()
    try:
        playlists = build(args.root, args.output_root)
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, f"Build failed; check declared inputs: {error}\n")
    print(f"Built {len(playlists)} shows, {sum(len(p['tracks']) for p in playlists)} tracks")


if __name__ == '__main__':
    main()
