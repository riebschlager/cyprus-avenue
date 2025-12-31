#!/bin/bash
#
# Update Playlists Script
#
# Parses all TXT files and regenerates JSON files (both root and web/public).
# This is fast (< 1 second) and safe to run frequently.
#
# Usage:
#   ./update-playlists.sh
#
# What it does:
#   1. Parses archive/txt/*.txt files
#   2. Generates json/individual/*.json files
#   3. Generates json/playlists.json
#   4. Copies to web/public/playlists.json
#   5. Runs validation and shows quality report
#

set -e  # Exit on error

echo "🔄 Cyprus Avenue - Update Playlists"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -d "archive/txt" ]; then
    echo "❌ Error: archive/txt directory not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

# Build Docker image if needed
echo "📦 Building parser Docker image..."
docker build -f docker/Dockerfile.parse -t cyprus-avenue-parser . -q

# Get absolute path to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "📝 Parsing playlist files..."
echo ""

# Run parser with mounted volumes
docker run --rm \
    -v "$PROJECT_ROOT/archive/txt:/app/txt" \
    -v "$PROJECT_ROOT/json:/app/json" \
    -v "$PROJECT_ROOT/web/public:/app/web/public" \
    cyprus-avenue-parser

echo ""
echo "✅ Parsing complete!"
echo ""
echo "🔍 Running validation..."
echo ""

# Run validation
docker run --rm \
    -v "$PROJECT_ROOT/json:/app/json" \
    cyprus-avenue-parser \
    python validate_playlists.py

echo ""
echo "✨ Update complete! Your playlist data is ready."
echo ""
