#!/usr/bin/env python3
"""
Playlist Data Validator

Validates parsed playlist data and generates a quality report.
Reports issues like:
- Playlists with 0 tracks
- Tracks with missing artist/song
- Duplicate dates
- Malformed entries
"""

import json
from pathlib import Path
from collections import defaultdict


def validate_playlists(json_dir='json/individual', consolidated_path='json/playlists.json'):
    """Validate all playlist data and generate a report"""

    print("🔍 Validating Playlist Data")
    print("=" * 70)

    issues = []
    warnings = []
    stats = {
        'total_playlists': 0,
        'total_tracks': 0,
        'empty_playlists': 0,
        'tracks_missing_artist': 0,
        'tracks_missing_song': 0,
        'duplicate_dates': 0,
        'playlists_missing_date': 0,
        'playlists_missing_title': 0
    }

    json_path = Path(json_dir)
    all_playlists = []
    dates_seen = defaultdict(list)

    # Load all individual playlist files
    json_files = sorted(json_path.glob('*.json'))

    if not json_files:
        issues.append(f"❌ ERROR: No JSON files found in {json_dir}")
        return issues, warnings, stats

    print(f"\nValidating {len(json_files)} playlist files...\n")

    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                playlist = json.load(f)

            all_playlists.append(playlist)
            stats['total_playlists'] += 1

            # Validate date
            if not playlist.get('date'):
                stats['playlists_missing_date'] += 1
                issues.append(f"⚠️  {json_file.name}: Missing date")
            else:
                dates_seen[playlist['date']].append(json_file.name)

            # Validate title
            if not playlist.get('title'):
                stats['playlists_missing_title'] += 1
                warnings.append(f"⚠️  {json_file.name}: Missing title")

            # Validate tracks
            tracks = playlist.get('tracks', [])
            stats['total_tracks'] += len(tracks)

            if len(tracks) == 0:
                stats['empty_playlists'] += 1
                issues.append(f"❌ {json_file.name}: Empty playlist (0 tracks)")

            # Validate each track
            for i, track in enumerate(tracks, 1):
                if not isinstance(track, dict):
                    issues.append(f"❌ {json_file.name}: Track #{i} is not a valid object")
                    continue

                if not track.get('artist'):
                    stats['tracks_missing_artist'] += 1
                    warnings.append(f"⚠️  {json_file.name}: Track #{i} missing artist")

                if not track.get('song'):
                    stats['tracks_missing_song'] += 1
                    warnings.append(f"⚠️  {json_file.name}: Track #{i} missing song")

        except json.JSONDecodeError as e:
            issues.append(f"❌ {json_file.name}: Invalid JSON - {e}")
        except Exception as e:
            issues.append(f"❌ {json_file.name}: Error reading file - {e}")

    # Check for duplicate dates
    for date, files in dates_seen.items():
        if len(files) > 1:
            stats['duplicate_dates'] += 1
            issues.append(f"❌ Duplicate date {date}: {', '.join(files)}")

    # Validate consolidated file exists and matches
    if Path(consolidated_path).exists():
        try:
            with open(consolidated_path, 'r', encoding='utf-8') as f:
                consolidated = json.load(f)

            if len(consolidated) != len(all_playlists):
                issues.append(
                    f"❌ Consolidated file mismatch: "
                    f"Has {len(consolidated)} playlists but found {len(all_playlists)} individual files"
                )
        except Exception as e:
            issues.append(f"❌ Error reading consolidated file: {e}")
    else:
        warnings.append(f"⚠️  Consolidated file not found: {consolidated_path}")

    # Print report
    print("\n" + "=" * 70)
    print("📊 Validation Report")
    print("=" * 70)

    print(f"\n✓ Total playlists validated: {stats['total_playlists']}")
    print(f"✓ Total tracks: {stats['total_tracks']}")

    if stats['total_playlists'] > 0:
        avg_tracks = stats['total_tracks'] / stats['total_playlists']
        print(f"✓ Average tracks per playlist: {avg_tracks:.1f}")

    # Print issues
    if issues:
        print(f"\n❌ Found {len(issues)} critical issues:")
        for issue in issues[:20]:  # Limit to first 20
            print(f"  {issue}")
        if len(issues) > 20:
            print(f"  ... and {len(issues) - 20} more issues")
    else:
        print(f"\n✓ No critical issues found!")

    # Print warnings
    if warnings:
        print(f"\n⚠️  Found {len(warnings)} warnings:")
        for warning in warnings[:10]:  # Limit to first 10
            print(f"  {warning}")
        if len(warnings) > 10:
            print(f"  ... and {len(warnings) - 10} more warnings")
    else:
        print(f"\n✓ No warnings!")

    # Print specific stats if there are issues
    if stats['empty_playlists'] > 0:
        print(f"\n⚠️  Empty playlists: {stats['empty_playlists']}")
    if stats['tracks_missing_artist'] > 0:
        print(f"⚠️  Tracks missing artist: {stats['tracks_missing_artist']}")
    if stats['tracks_missing_song'] > 0:
        print(f"⚠️  Tracks missing song: {stats['tracks_missing_song']}")
    if stats['duplicate_dates'] > 0:
        print(f"⚠️  Duplicate dates: {stats['duplicate_dates']}")

    print("\n" + "=" * 70)

    # Return validation result
    if issues:
        print("\n❌ Validation FAILED - Please fix critical issues\n")
        return False
    else:
        print("\n✅ Validation PASSED - Data is ready to use!\n")
        return True


if __name__ == '__main__':
    validate_playlists()
