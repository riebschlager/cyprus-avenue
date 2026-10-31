"""Offline regression checks for archive preservation and publishing failures."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'parsing'))
from parse_playlists import REPO_ROOT, assemble_playlists, build, read_json
from validate_playlists import validate_playlists


def contents(root):
    return {str(p.relative_to(root)): p.read_bytes() for p in root.rglob('*.json')}


class DataOwnershipTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'inputs'
        self.output = Path(self.temp.name) / 'exports'
        shutil.copytree(REPO_ROOT / 'archive', self.root / 'archive')
        shutil.copytree(REPO_ROOT / 'data/source', self.root / 'data/source')

    def write(self, name, value):
        (self.root / 'data/source' / name).write_text(json.dumps(value))

    def test_clean_rebuild_preserves_archive_metadata_and_is_deterministic(self):
        records = build(self.root, self.output)
        self.assertEqual(records, read_json(REPO_ROOT / 'json/playlists.json'))
        self.assertEqual(len(records), 125)
        self.assertEqual(sum(len(p['tracks']) for p in records), 1448)
        for imported in (self.root / 'data/source/imported-playlists').glob('*.json'):
            self.assertIn(read_json(imported), records)
        for name in ('artist-bios.json', 'spotify-index.json'):
            self.assertEqual(read_json(self.output / 'web/public' / name),
                             read_json(REPO_ROOT / 'web/public' / name))
        first = contents(self.output)
        build(self.root, self.output)
        self.assertEqual(first, contents(self.output))
        self.assertTrue(validate_playlists(self.root, self.output))

    def test_corrections_overrides_and_stale_exports(self):
        original = assemble_playlists(self.root)[0]['tracks'][0]
        self.write('corrections.json', [{'date': '2009-12-12', 'from': original,
                                        'to': {'artist': 'Reviewed artist', 'song': 'Reviewed song'}}])
        key = 'Reviewed artist|Reviewed song'
        override = {'spotifyUrl': 'https://open.spotify.com/track/reviewed', 'manual': True}
        self.write('spotify-overrides.json', {key: override})
        build(self.root, self.output)
        self.assertEqual(read_json(self.output / 'json/playlists.json')[0]['tracks'][0]['artist'], 'Reviewed artist')
        self.assertEqual(read_json(self.output / 'web/public/spotify-index.json')[key], override)
        stale = self.output / 'json/individual/1900-01-01.json'
        stale.write_text('{}')
        build(self.root, self.output)
        self.assertFalse(stale.exists())
        self.assertTrue(validate_playlists(self.root, self.output))

    def test_invalid_sources_do_not_publish_partial_results(self):
        build(self.root, self.output)
        first = contents(self.output)
        self.write('imported-playlists/2013-06-22.json', {'date': 'bad-date'})
        with self.assertRaises(ValueError):
            build(self.root, self.output)
        self.assertEqual(first, contents(self.output))

    def test_invalid_metadata_or_unmatched_corrections_do_not_publish(self):
        build(self.root, self.output)
        first = contents(self.output)
        self.write('corrections.json', [{'from': {'artist': 'absent', 'song': 'absent'},
                                        'to': {'artist': 'new', 'song': 'new'}}])
        with self.assertRaises(ValueError):
            build(self.root, self.output)
        self.assertEqual(first, contents(self.output))
        self.write('corrections.json', [])
        self.write('spotify-overrides.json', {'bad': {}})
        with self.assertRaises(ValueError):
            build(self.root, self.output)
        self.assertEqual(first, contents(self.output))

    def test_validator_rejects_same_count_content_drift_and_empty_exports(self):
        build(self.root, self.output)
        target = self.output / 'web/public/playlists.json'
        records = read_json(target)
        records[0]['title'] = 'Silent data loss'
        target.write_text(json.dumps(records))
        self.assertFalse(validate_playlists(self.root, self.output))
        result = subprocess.run([sys.executable, str(REPO_ROOT / 'scripts/parsing/validate_playlists.py'),
                                 '--root', str(self.root), '--output-root', str(self.output)], capture_output=True)
        self.assertEqual(result.returncode, 1)
        shutil.rmtree(self.output)
        self.assertFalse(validate_playlists(self.root, self.output))

    def test_deleted_text_source_is_not_preserved_by_old_output(self):
        build(self.root, self.output)
        (self.root / 'archive/txt/2009-12-12.txt').unlink()
        records = build(self.root, self.output)
        self.assertEqual(len(records), 124)
        self.assertFalse((self.output / 'json/individual/2009-12-12.json').exists())


if __name__ == '__main__':
    unittest.main()
