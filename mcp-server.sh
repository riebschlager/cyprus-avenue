#!/bin/bash
set -e

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Initialize Volta if available (needed for non-interactive shells like Claude Desktop)
export VOLTA_HOME="$HOME/.volta"
if [ -d "$VOLTA_HOME" ]; then
    export PATH="$VOLTA_HOME/bin:$PATH"
fi

if [ "$#" -ne 0 ]; then
    echo "Usage: mcp-server.sh (local Node.js only)" >&2
    exit 2
fi
# Compile on every launch so source changes cannot leave a stale server.
if [ ! -d "$PROJECT_ROOT/mcp/node_modules" ]; then
    npm --prefix "$PROJECT_ROOT/mcp" ci >&2
fi
npm --prefix "$PROJECT_ROOT/mcp" run build >&2
exec node "$PROJECT_ROOT/mcp/dist/index.js"
