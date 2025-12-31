#!/bin/bash
#
# Index Spotify Tracks Script
#
# Indexes all tracks with Spotify API to get direct track links.
# This is VERY slow (~7-10 minutes for 1,449 tracks) - only run after major updates.
#
# Prerequisites:
#   - Spotify API credentials in .env file (see .env.example)
#   OR
#   - Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables
#
# Usage:
#   ./index-spotify.sh
#
# What it does:
#   1. Reads json/playlists.json
#   2. Searches Spotify for each unique track
#   3. Generates web/public/spotify-index.json
#   4. Shows match statistics
#

set -e  # Exit on error

echo "🎵 Cyprus Avenue - Index Spotify Tracks"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "json/playlists.json" ]; then
    echo "❌ Error: json/playlists.json not found"
    echo "   Please run ./update-playlists.sh first"
    exit 1
fi

# Check for credentials
if [ ! -f ".env" ] && [ -z "$SPOTIFY_CLIENT_ID" ]; then
    echo "❌ Error: Spotify credentials not found"
    echo ""
    echo "Please either:"
    echo "  1. Create a .env file with your Spotify credentials (recommended)"
    echo "     cp .env.example .env"
    echo "     # Then edit .env and add your credentials"
    echo ""
    echo "  2. Set environment variables:"
    echo "     export SPOTIFY_CLIENT_ID=your_id"
    echo "     export SPOTIFY_CLIENT_SECRET=your_secret"
    echo ""
    echo "Get credentials from: https://developer.spotify.com/dashboard"
    exit 1
fi

# Get absolute path to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "⏱️  This will take 7-10 minutes for ~1,449 tracks"
echo "   (Spotify API has rate limits)"
echo ""
read -p "Continue? [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🔑 Checking Node.js installation..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo ""
echo "🎵 Indexing tracks with Spotify..."
echo ""

# Run the indexer
cd "$PROJECT_ROOT"

# Load .env if it exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

node scripts/spotify/index-spotify-tracks.js

echo ""
echo "✨ Spotify indexing complete!"
echo ""
echo "📄 Results saved to: web/public/spotify-index.json"
echo ""
