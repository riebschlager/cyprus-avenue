#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadArchiveData } from './data/loader.js';
import type { ArchiveData } from './types.js';

// Import tool implementations
import {
  searchPlaylists,
  getPlaylist,
  searchArtists,
  getArtist,
  searchTracks,
  getTrack,
} from './tools/search.js';

import {
  discoverByTag,
  thisWeekInHistory,
  similarArtists,
  randomDiscovery,
  findConnections,
  suggestByMoodOrEra,
} from './tools/discovery.js';

import {
  getStatistics,
  analyzeTopArtists,
  analyzeGenreTrends,
  analyzeThemes,
  getCurationSummary,
} from './tools/analysis.js';

import {
  generatePlaylistDocument,
  generateArtistProfile,
  generateDiscoveryReport,
  generateYearInReview,
} from './tools/artifacts.js';

// Load archive data at startup
let archiveData: ArchiveData;

const server = new Server(
  {
    name: 'cyprus-avenue',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all tools
const TOOLS = [
  // Core Query Tools (1-6)
  {
    name: 'search_playlists',
    description:
      'Search Cyprus Avenue playlists by date range, title keywords, or description content. Returns matching playlists with track counts and sample artists.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search text to match in title or description',
        },
        startDate: {
          type: 'string',
          description: 'Start date filter (YYYY-MM-DD format)',
        },
        endDate: {
          type: 'string',
          description: 'End date filter (YYYY-MM-DD format)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 20)',
        },
      },
    },
  },
  {
    name: 'get_playlist',
    description:
      'Get full details of a specific Cyprus Avenue playlist by date, including all tracks with Spotify links where available.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Playlist date in YYYY-MM-DD format',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'search_artists',
    description:
      'Search artists in the Cyprus Avenue archive by name, biography content, or genre tags. Filter by minimum Spotify popularity.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search text to match in name or bio',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by genre tags (e.g., ["soul", "blues"])',
        },
        minPopularity: {
          type: 'number',
          description: 'Minimum Spotify popularity score (0-100)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 20)',
        },
      },
    },
  },
  {
    name: 'get_artist',
    description:
      'Get detailed artist profile including biography, stats, tags, and all Cyprus Avenue appearances with tracks.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Artist name (fuzzy matching supported)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_tracks',
    description:
      'Search tracks in the Cyprus Avenue archive by artist, song name, or genre. Returns Spotify links where available.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search text to match in artist or song name',
        },
        artist: {
          type: 'string',
          description: 'Filter by specific artist',
        },
        genres: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by genre tags',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 50)',
        },
      },
    },
  },
  {
    name: 'get_track',
    description:
      'Get details of a specific track including Spotify data (URL, preview, album art) and all playlist appearances.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        artist: {
          type: 'string',
          description: 'Artist name',
        },
        song: {
          type: 'string',
          description: 'Song title',
        },
      },
      required: ['artist', 'song'],
    },
  },

  // Discovery Tools (7-12)
  {
    name: 'discover_by_tag',
    description:
      'Find all artists and tracks matching genre tags. Use matchAll to require all tags or any tag.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Genre tags to search for (e.g., ["soul", "blues"])',
        },
        matchAll: {
          type: 'boolean',
          description: 'If true, require all tags to match. Default: false (any tag)',
        },
        limit: {
          type: 'number',
          description: 'Maximum artists to return (default: 30)',
        },
      },
      required: ['tags'],
    },
  },
  {
    name: 'this_week_in_history',
    description:
      'Find Cyprus Avenue playlists from the same week in past years. Great for nostalgic music discovery.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Reference date (YYYY-MM-DD). Defaults to today.',
        },
      },
    },
  },
  {
    name: 'similar_artists',
    description:
      'Find artists with similar genre tags to a given artist. Ranked by tag similarity score.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        artist: {
          type: 'string',
          description: 'Artist name to find similar artists for',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 20)',
        },
      },
      required: ['artist'],
    },
  },
  {
    name: 'random_discovery',
    description:
      'Get a random playlist or artist for serendipitous music exploration.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['playlist', 'artist'],
          description: 'Type of random selection',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'find_artist_connections',
    description:
      'Find artists who appeared on the same Cyprus Avenue playlists. Reveals musical connections and shared show appearances.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        artist: {
          type: 'string',
          description: 'Artist name to find connections for',
        },
        minCoOccurrences: {
          type: 'number',
          description: 'Minimum times artists appeared together (default: 1)',
        },
        limit: {
          type: 'number',
          description: 'Maximum connections to return (default: 20)',
        },
      },
      required: ['artist'],
    },
  },
  {
    name: 'suggest_by_mood_or_era',
    description:
      'Suggest playlists based on mood keywords (upbeat, soulful, melancholy) or musical era (60s, classic rock, americana).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Mood keyword or era (e.g., "soulful", "60s", "road trip", "americana")',
        },
        queryType: {
          type: 'string',
          enum: ['mood', 'era', 'auto'],
          description: 'Query type. Use "auto" to detect automatically (default).',
        },
        limit: {
          type: 'number',
          description: 'Maximum playlists to return (default: 10)',
        },
      },
      required: ['query'],
    },
  },

  // Curation Analysis Tools (13-17)
  {
    name: 'get_statistics',
    description:
      'Get overview statistics of the Cyprus Avenue archive: total playlists, tracks, artists, Spotify coverage, and top tags.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'analyze_top_artists',
    description:
      'Analyze most featured artists in the archive with appearance counts and dedicated shows.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        startYear: {
          type: 'number',
          description: 'Filter by start year',
        },
        endYear: {
          type: 'number',
          description: 'Filter by end year',
        },
        limit: {
          type: 'number',
          description: 'Maximum artists to return (default: 25)',
        },
      },
    },
  },
  {
    name: 'analyze_genre_trends',
    description:
      'Analyze how genre popularity changed over time in the archive. Shows rising and declining genres.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        startYear: {
          type: 'number',
          description: 'Filter by start year',
        },
        endYear: {
          type: 'number',
          description: 'Filter by end year',
        },
      },
    },
  },
  {
    name: 'analyze_themes',
    description:
      'Identify thematic patterns in the archive: artist tributes, best-of lists, holiday specials, etc.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_curation_summary',
    description:
      'Get comprehensive curation analysis: top artists, dominant genres, themes, and curatorial observations about Bill Shapiro\'s playlist style.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },

  // Artifact Generation Tools (18-21)
  {
    name: 'generate_playlist_document',
    description:
      'Generate a shareable playlist document with all tracks and Spotify links. Returns both markdown and JSON.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Playlist date (YYYY-MM-DD format)',
        },
        includeSpotifyLinks: {
          type: 'boolean',
          description: 'Include Spotify links (default: true)',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'generate_artist_profile',
    description:
      'Generate a comprehensive artist profile document with bio, stats, and all Cyprus Avenue appearances. Returns both markdown and JSON.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        artist: {
          type: 'string',
          description: 'Artist name',
        },
      },
      required: ['artist'],
    },
  },
  {
    name: 'generate_discovery_report',
    description:
      'Generate a themed music discovery document based on genre tags. Returns both markdown and JSON with all matching artists and sample tracks.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Genre tags for discovery (e.g., ["blues", "soul"])',
        },
        title: {
          type: 'string',
          description: 'Custom title for the report',
        },
      },
      required: ['tags'],
    },
  },
  {
    name: 'generate_year_in_review',
    description:
      'Generate an annual summary document for a specific year with all playlists, top artists, and genre breakdown. Returns both markdown and JSON.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        year: {
          type: 'number',
          description: 'Year to review (e.g., 2015)',
        },
      },
      required: ['year'],
    },
  },
];

// Register tools list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      // Core Query Tools
      case 'search_playlists':
        result = searchPlaylists(archiveData, args as Parameters<typeof searchPlaylists>[1]);
        break;
      case 'get_playlist':
        result = getPlaylist(archiveData, args as Parameters<typeof getPlaylist>[1]);
        break;
      case 'search_artists':
        result = searchArtists(archiveData, args as Parameters<typeof searchArtists>[1]);
        break;
      case 'get_artist':
        result = getArtist(archiveData, args as Parameters<typeof getArtist>[1]);
        break;
      case 'search_tracks':
        result = searchTracks(archiveData, args as Parameters<typeof searchTracks>[1]);
        break;
      case 'get_track':
        result = getTrack(archiveData, args as Parameters<typeof getTrack>[1]);
        break;

      // Discovery Tools
      case 'discover_by_tag':
        result = discoverByTag(archiveData, args as Parameters<typeof discoverByTag>[1]);
        break;
      case 'this_week_in_history':
        result = thisWeekInHistory(archiveData, args as Parameters<typeof thisWeekInHistory>[1]);
        break;
      case 'similar_artists':
        result = similarArtists(archiveData, args as Parameters<typeof similarArtists>[1]);
        break;
      case 'random_discovery':
        result = randomDiscovery(archiveData, args as Parameters<typeof randomDiscovery>[1]);
        break;
      case 'find_artist_connections':
        result = findConnections(archiveData, args as Parameters<typeof findConnections>[1]);
        break;
      case 'suggest_by_mood_or_era':
        result = suggestByMoodOrEra(archiveData, args as Parameters<typeof suggestByMoodOrEra>[1]);
        break;

      // Analysis Tools
      case 'get_statistics':
        result = getStatistics(archiveData);
        break;
      case 'analyze_top_artists':
        result = analyzeTopArtists(archiveData, args as Parameters<typeof analyzeTopArtists>[1]);
        break;
      case 'analyze_genre_trends':
        result = analyzeGenreTrends(archiveData, args as Parameters<typeof analyzeGenreTrends>[1]);
        break;
      case 'analyze_themes':
        result = analyzeThemes(archiveData);
        break;
      case 'get_curation_summary':
        result = getCurationSummary(archiveData);
        break;

      // Artifact Generation Tools
      case 'generate_playlist_document':
        result = generatePlaylistDocument(archiveData, args as Parameters<typeof generatePlaylistDocument>[1]);
        break;
      case 'generate_artist_profile':
        result = generateArtistProfile(archiveData, args as Parameters<typeof generateArtistProfile>[1]);
        break;
      case 'generate_discovery_report':
        result = generateDiscoveryReport(archiveData, args as Parameters<typeof generateDiscoveryReport>[1]);
        break;
      case 'generate_year_in_review':
        result = generateYearInReview(archiveData, args as Parameters<typeof generateYearInReview>[1]);
        break;

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  // Load archive data before starting server
  archiveData = loadArchiveData();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Cyprus Avenue MCP server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
