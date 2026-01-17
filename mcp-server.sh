#!/bin/bash
set -e

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Initialize Volta if available (needed for non-interactive shells like Claude Desktop)
export VOLTA_HOME="$HOME/.volta"
if [ -d "$VOLTA_HOME" ]; then
    export PATH="$VOLTA_HOME/bin:$PATH"
fi

# Check if we need to build
if [ ! -d "$PROJECT_ROOT/mcp/dist" ]; then
    echo "Building MCP server..." >&2
    cd "$PROJECT_ROOT/mcp"
    npm install >&2
    npm run build >&2
    cd "$PROJECT_ROOT"
fi

# Check if running in Docker mode
if [ "$1" = "--docker" ]; then
    echo "Building Docker container..." >&2
    docker build -f "$PROJECT_ROOT/docker/Dockerfile.mcp" -t cyprus-avenue-mcp "$PROJECT_ROOT" -q >&2

    echo "Starting MCP server (Docker mode)..." >&2
    exec docker run --rm -i cyprus-avenue-mcp
else
    # Run directly with Node.js
    exec node "$PROJECT_ROOT/mcp/dist/index.js"
fi
