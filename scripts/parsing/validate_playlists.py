#!/usr/bin/env python3
"""Verify complete export parity against the declared, offline source inputs."""
import argparse
from pathlib import Path
from parse_playlists import REPO_ROOT, assemble_playlists, assemble_metadata, read_json, validate_records


def validate_playlists(root=REPO_ROOT, output_root=None):
    root = Path(root)
    output = Path(output_root) if output_root else root
    try:
        expected = assemble_playlists(root)
        individual_dir = output / 'json/individual'
        individual = [read_json(p) for p in sorted(individual_dir.glob('*.json'))]
        validate_records(individual)
        expected_names = {p['date'] + '.json' for p in expected}
        if {p.name for p in individual_dir.glob('*.json')} != expected_names:
            raise ValueError('Individual filenames differ from declared sources')
        for label, records in (
            ('individual', individual),
            ('consolidated', read_json(output / 'json/playlists.json')),
            ('public', read_json(output / 'web/public/playlists.json')),
        ):
            if records != expected:
                raise ValueError(f'{label} records differ from declared sources')
        for filename, metadata in assemble_metadata(root).items():
            if read_json(output / 'web/public' / filename) != metadata:
                raise ValueError(f'{filename} differs from retained snapshot and overrides')
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f'Validation FAILED: {error}')
        return False
    print(f'Validation PASSED: {len(expected)} shows; all exports match declared inputs')
    return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=REPO_ROOT)
    parser.add_argument('--output-root', type=Path)
    args = parser.parse_args()
    raise SystemExit(0 if validate_playlists(args.root, args.output_root) else 1)
