"""Small fixtures pin parser formats and validator failure guarantees."""
import copy
import json
from pathlib import Path
import socket
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'parsing'))
from parse_playlists import REPO_ROOT, build, parse_playlist_file, read_json, validate_records
from validate_playlists import validate_playlists


class ParserFormats(unittest.TestCase):
    def test_representative_formats(self):
        cases = [
            ('Year End\n\nArtist One, Album One\nArtist Two, Album Two',
             [('Artist One', 'Album One'), ('Artist Two', 'Album Two')]),
            ('Mixed Show\nBy Bill Shapiro\nA description.\nTrack List:\n'
             '1. Artist One: “Song One”\nArtist Two — "Song Two"\n'
             '"Song Three" - Artist Three\nArtist Four     Song Four',
             [('Artist One', 'Song One'), ('Artist Two', 'Song Two'),
              ('Artist Three', 'Song Three'), ('Artist Four', 'Song Four')]),
            ('Remembering Prince\nBy Bill Shapiro\nA tribute.\nTracks:\n'
             '"Ghost Train Four-Oh-Ten"\n- “Another Song”\n"Final Song" from Album',
             [('Prince', 'Ghost Train Four-Oh-Ten'), ('Prince', 'Another Song'), ('Prince', 'Final Song')]),
        ]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / '2016-02-29.txt'
            for text, tracks in cases:
                with self.subTest(text=text):
                    path.write_text(text)
                    record = parse_playlist_file(path, '2025-12-31')
                    self.assertEqual([(t['artist'], t['song']) for t in record['tracks']], tracks)
                    self.assertEqual(record['date'], '2016-02-29')
                    self.assertEqual(record['archived_date'], '2025-12-31')


class ValidationContract(unittest.TestCase):
    def test_schema_and_calendar_dates(self):
        record = read_json(REPO_ROOT / 'json/playlists.json')[0]
        for field, invalid in [('date', '2015-02-29'), ('date', '2015-1-3'),
                               ('archived_date', '2025-13-01'), ('title', ''),
                               ('tracks', []), ('tracks', [None]), ('tracks', [{'artist': ' ', 'song': 'x'}])]:
            with self.subTest(field=field, invalid=invalid):
                bad = copy.deepcopy(record)
                bad[field] = invalid
                with self.assertRaises((ValueError, KeyError, TypeError)):
                    validate_records([bad])
        for records in ([], {}, [None], [record, record]):
            with self.assertRaises((ValueError, KeyError, TypeError)):
                validate_records(records)

    def test_every_export_rejects_drift_and_missing_records_offline(self):
        # No external connections may be used even for a complete archive rebuild.
        with tempfile.TemporaryDirectory() as directory, patch.object(
                socket, 'socket', side_effect=AssertionError('Network disabled')):
            output = Path(directory)
            build(REPO_ROOT, output)
            self.assertTrue(validate_playlists(REPO_ROOT, output))
            for relative in ('json/individual/2009-12-12.json', 'json/playlists.json',
                             'web/public/playlists.json'):
                target = output / relative
                original = target.read_text()
                value = json.loads(original)
                record = value[0] if isinstance(value, list) else value
                record['tracks'][0]['song'] = 'Changed without changing counts'
                target.write_text(json.dumps(value))
                self.assertFalse(validate_playlists(REPO_ROOT, output))
                target.write_text(original)
            imported = output / 'json/individual/2013-06-22.json'
            imported.unlink()
            self.assertFalse(validate_playlists(REPO_ROOT, output))
