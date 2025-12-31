#!/bin/bash
#
# Discover Playlists Script
#
# Scrapes KCUR website to find available playlists and identify gaps.
# This is slow (~30 seconds) - only run when looking for new content.
#
# Usage:
#   ./discover.sh
#
# What it does:
#   1. Scrapes KCUR.org for Cyprus Avenue playlists
#   2. Compares against your archive
#   3. Generates data/discovered_playlists.json
#   4. Generates data/gap_analysis.json (shows missing playlists)
#

set -e  # Exit on error

echo "🔍 Cyprus Avenue - Discover Playlists"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -d "json/individual" ]; then
    echo "❌ Error: json/individual directory not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

# Build Docker image if needed
echo "📦 Building discovery Docker image..."
docker build -f docker/Dockerfile.discover -t cyprus-avenue-discover . -q

# Get absolute path to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "🌐 Scraping KCUR website..."
echo "   (This may take 30-60 seconds)"
echo ""

# Run discovery tool with mounted volumes
docker run --rm \
    -v "$PROJECT_ROOT:/app" \
    cyprus-avenue-discover

echo ""
echo "✨ Discovery complete!"
echo ""
echo "📄 Results saved to:"
echo "   - data/discovered_playlists.json"
echo "   - data/gap_analysis.json"
echo ""
echo "💡 Check data/gap_analysis.json to see if any playlists are missing from your archive."
echo ""
