#!/bin/bash
# Offline assembly from declared sources; no API credentials required.
set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$PROJECT_ROOT/scripts/parsing/parse_playlists.py" "$@"
python3 "$PROJECT_ROOT/scripts/parsing/validate_playlists.py" "$@"
