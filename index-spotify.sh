#!/bin/bash
set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$PROJECT_ROOT/scripts/spotify/index-spotify-tracks.js" "$@"
