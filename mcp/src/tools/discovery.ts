// Discovery tools (7-12)

import type { ArchiveData, PlaylistSuggestion } from '../types.js';
import { findBestMatch, normalize } from '../utils/fuzzyMatch.js';
import { findArtistConnections, findSimilarArtists } from '../utils/similarity.js';
import { getTagsForQuery, detectQueryType, MOOD_MAPPINGS, ERA_MAPPINGS } from '../data/tagMappings.js';
import { getArtistBio } from '../data/loader.js';

// 7. discover_by_tag - Find all artists and tracks matching genre tags
export function discoverByTag(
  data: ArchiveData,
  params: {
    tags: string[];
    matchAll?: boolean;
    limit?: number;
  }
): {
  tags: string[];
  matchType: 'any' | 'all';
  totalArtists: number;
  artists: {
    name: string;
    matchingTags: string[];
    allTags: string[];
    trackCount: number;
    popularity?: number;
    image?: string;
    spotifyUrl?: string;
  }[];
} {
  const { tags, matchAll = false, limit = 30 } = params;
  const normalizedTags = tags.map((t) => t.toLowerCase());

  // Find matching artists
  const matchingArtists: {
    name: string;
    matchingTags: string[];
    allTags: string[];
  }[] = [];

  for (const [artist, bio] of Object.entries(data.artistBios)) {
    const artistTags = (bio.tags || []).map((t) => t.toLowerCase());
    const matching = normalizedTags.filter((t) => artistTags.includes(t));

    if (matchAll) {
      // All tags must match
      if (matching.length === normalizedTags.length) {
        matchingArtists.push({
          name: artist,
          matchingTags: matching,
          allTags: bio.tags || [],
        });
      }
    } else {
      // Any tag can match
      if (matching.length > 0) {
        matchingArtists.push({
          name: artist,
          matchingTags: matching,
          allTags: bio.tags || [],
        });
      }
    }
  }

  // Sort by number of matching tags, then by track count
  matchingArtists.sort((a, b) => {
    const tagDiff = b.matchingTags.length - a.matchingTags.length;
    if (tagDiff !== 0) return tagDiff;

    const countA = data.artistToPlaylists.get(a.name)?.length || 0;
    const countB = data.artistToPlaylists.get(b.name)?.length || 0;
    return countB - countA;
  });

  const limited = matchingArtists.slice(0, limit);

  return {
    tags,
    matchType: matchAll ? 'all' : 'any',
    totalArtists: matchingArtists.length,
    artists: limited.map((a) => {
      const bio = data.artistBios[a.name];
      const appearances = data.artistToPlaylists.get(a.name) || [];
      const trackCount = appearances.reduce((sum, app) => sum + app.songs.length, 0);

      return {
        name: a.name,
        matchingTags: a.matchingTags,
        allTags: a.allTags,
        trackCount,
        popularity: bio?.popularity,
        image: bio?.image,
        spotifyUrl: bio?.spotifyUrl,
      };
    }),
  };
}

// 8. this_week_in_history - Find playlists from the same week in past years
export function thisWeekInHistory(
  data: ArchiveData,
  params: { date?: string }
): {
  referenceDate: string;
  playlists: {
    date: string;
    title: string;
    description: string;
    trackCount: number;
    yearsAgo: number;
  }[];
} {
  const refDate = params.date ? new Date(params.date) : new Date();
  const refMonth = refDate.getMonth();
  const refDay = refDate.getDate();

  const matching: {
    date: string;
    title: string;
    description: string;
    trackCount: number;
    yearsAgo: number;
  }[] = [];

  for (const playlist of data.playlists) {
    const playlistDate = new Date(playlist.date);
    const playlistMonth = playlistDate.getMonth();
    const playlistDay = playlistDate.getDate();

    // Check if within ±3 days (accounting for month boundaries)
    const dayDiff = Math.abs(
      (playlistMonth - refMonth) * 30 + (playlistDay - refDay)
    );

    // Simple check: same month and within 3 days
    if (playlistMonth === refMonth && Math.abs(playlistDay - refDay) <= 3) {
      const yearsAgo = refDate.getFullYear() - playlistDate.getFullYear();
      if (yearsAgo > 0) {
        matching.push({
          date: playlist.date,
          title: playlist.title,
          description: playlist.description?.substring(0, 200) || '',
          trackCount: playlist.tracks.length,
          yearsAgo,
        });
      }
    }

    // Handle month boundaries (e.g., Jan 2 should match Dec 30)
    if (
      (refMonth === 0 && playlistMonth === 11) ||
      (refMonth === 11 && playlistMonth === 0)
    ) {
      const adjustedDiff =
        refMonth === 0
          ? (31 - playlistDay) + refDay
          : (31 - refDay) + playlistDay;

      if (adjustedDiff <= 3) {
        const yearsAgo = refDate.getFullYear() - playlistDate.getFullYear();
        if (yearsAgo > 0) {
          matching.push({
            date: playlist.date,
            title: playlist.title,
            description: playlist.description?.substring(0, 200) || '',
            trackCount: playlist.tracks.length,
            yearsAgo,
          });
        }
      }
    }
  }

  // Sort by years ago
  matching.sort((a, b) => a.yearsAgo - b.yearsAgo);

  return {
    referenceDate: refDate.toISOString().split('T')[0],
    playlists: matching,
  };
}

// 9. similar_artists - Find artists with similar tags/genres
export function similarArtists(
  data: ArchiveData,
  params: { artist: string; limit?: number }
): {
  found: boolean;
  sourceArtist?: string;
  sourceTags?: string[];
  similar?: {
    artist: string;
    similarity: number;
    sharedTags: string[];
    popularity?: number;
    image?: string;
    spotifyUrl?: string;
  }[];
  suggestions?: string[];
} {
  const { artist, limit = 20 } = params;

  // Find the artist
  let artistName = artist;
  let bio = data.artistBios[artist];

  if (!bio) {
    const match = findBestMatch(artist, Object.keys(data.artistBios));
    if (match.match) {
      artistName = match.match;
      bio = data.artistBios[artistName];
    } else {
      return {
        found: false,
        suggestions: match.suggestions,
      };
    }
  }

  const similar = findSimilarArtists(data, artistName, limit);

  return {
    found: true,
    sourceArtist: artistName,
    sourceTags: bio?.tags || [],
    similar: similar.map((s) => {
      const sBio = data.artistBios[s.artist];
      return {
        artist: s.artist,
        similarity: Math.round(s.similarity * 100) / 100,
        sharedTags: s.sharedTags,
        popularity: sBio?.popularity,
        image: sBio?.image,
        spotifyUrl: sBio?.spotifyUrl,
      };
    }),
  };
}

// 10. random_discovery - Get random playlist or artist for exploration
export function randomDiscovery(
  data: ArchiveData,
  params: { type: 'playlist' | 'artist' }
): {
  type: 'playlist' | 'artist';
  result:
    | {
        date: string;
        title: string;
        description: string;
        trackCount: number;
        sampleArtists: string[];
      }
    | {
        name: string;
        bio?: string;
        tags: string[];
        trackCount: number;
        image?: string;
        spotifyUrl?: string;
      };
} {
  const { type } = params;

  if (type === 'playlist') {
    const playlist = data.playlists[Math.floor(Math.random() * data.playlists.length)];
    return {
      type: 'playlist',
      result: {
        date: playlist.date,
        title: playlist.title,
        description: playlist.description?.substring(0, 300) || '',
        trackCount: playlist.tracks.length,
        sampleArtists: [...new Set(playlist.tracks.slice(0, 5).map((t) => t.artist))],
      },
    };
  } else {
    const artistName = data.allArtists[Math.floor(Math.random() * data.allArtists.length)];
    const bio = data.artistBios[artistName];
    const appearances = data.artistToPlaylists.get(artistName) || [];
    const trackCount = appearances.reduce((sum, a) => sum + a.songs.length, 0);

    return {
      type: 'artist',
      result: {
        name: artistName,
        bio: bio?.bioSummary?.replace(/<a[^>]*>.*?<\/a>/g, '').trim(),
        tags: bio?.tags || [],
        trackCount,
        image: bio?.image,
        spotifyUrl: bio?.spotifyUrl,
      },
    };
  }
}

// 11. find_artist_connections - Find artists who appeared on the same playlists
export function findConnections(
  data: ArchiveData,
  params: { artist: string; minCoOccurrences?: number; limit?: number }
): {
  found: boolean;
  sourceArtist?: string;
  sourceTags?: string[];
  totalConnections?: number;
  connections?: {
    artist: string;
    coOccurrences: number;
    sharedPlaylists: { date: string; title: string }[];
    sharedTags: string[];
    connectionStrength: number;
    image?: string;
    spotifyUrl?: string;
  }[];
  suggestions?: string[];
} {
  const { artist, minCoOccurrences = 1, limit = 20 } = params;

  // Find the artist
  let artistName = artist;
  let bio = data.artistBios[artist];

  if (!data.artistToPlaylists.has(artist)) {
    const match = findBestMatch(artist, data.allArtists);
    if (match.match) {
      artistName = match.match;
      bio = data.artistBios[artistName];
    } else {
      return {
        found: false,
        suggestions: match.suggestions,
      };
    }
  }

  const connections = findArtistConnections(data, artistName, minCoOccurrences, limit);

  return {
    found: true,
    sourceArtist: artistName,
    sourceTags: bio?.tags || [],
    totalConnections: connections.length,
    connections: connections.map((c) => {
      const cBio = data.artistBios[c.artist];
      return {
        artist: c.artist,
        coOccurrences: c.coOccurrences,
        sharedPlaylists: c.sharedPlaylists,
        sharedTags: c.sharedTags,
        connectionStrength: Math.round(c.connectionStrength * 100) / 100,
        image: cBio?.image,
        spotifyUrl: cBio?.spotifyUrl,
      };
    }),
  };
}

// 12. suggest_by_mood_or_era - Suggest playlists based on mood or musical era
export function suggestByMoodOrEra(
  data: ArchiveData,
  params: {
    query: string;
    queryType?: 'mood' | 'era' | 'auto';
    limit?: number;
  }
): {
  query: string;
  interpretedAs: {
    type: 'mood' | 'era' | 'unknown';
    mappedTags: string[];
    description?: string;
  };
  totalMatches: number;
  suggestions: PlaylistSuggestion[];
} {
  const { query, queryType = 'auto', limit = 10 } = params;

  const detectedType = queryType === 'auto' ? detectQueryType(query) : queryType;
  const mappedTags = getTagsForQuery(query, queryType);

  // Get era description if applicable
  let description: string | undefined;
  if (detectedType === 'era') {
    const lowerQuery = query.toLowerCase();
    for (const [era, eraData] of Object.entries(ERA_MAPPINGS)) {
      if (lowerQuery.includes(era) || era.includes(lowerQuery)) {
        description = eraData.description;
        break;
      }
    }
  }

  if (mappedTags.length === 0) {
    return {
      query,
      interpretedAs: {
        type: 'unknown',
        mappedTags: [],
      },
      totalMatches: 0,
      suggestions: [],
    };
  }

  // Score each playlist
  const scoredPlaylists: PlaylistSuggestion[] = [];
  const normalizedTags = mappedTags.map((t) => t.toLowerCase());

  for (const playlist of data.playlists) {
    let matchingTracks = 0;
    const artistTagCounts = new Map<string, number>();

    for (const track of playlist.tracks) {
      const bio = data.artistBios[track.artist];
      const artistTags = (bio?.tags || []).map((t) => t.toLowerCase());

      const hasMatch = normalizedTags.some((tag) =>
        artistTags.some((at) => at.includes(tag) || tag.includes(at))
      );

      if (hasMatch) {
        matchingTracks++;
        for (const tag of artistTags) {
          artistTagCounts.set(tag, (artistTagCounts.get(tag) || 0) + 1);
        }
      }
    }

    if (matchingTracks > 0) {
      const matchScore = matchingTracks / playlist.tracks.length;

      // Boost if title matches
      const titleLower = playlist.title.toLowerCase();
      const titleBoost = normalizedTags.some((t) => titleLower.includes(t)) ? 0.2 : 0;

      // Get dominant tags for this playlist
      const tagCounts = [...artistTagCounts.entries()].sort((a, b) => b[1] - a[1]);
      const dominantTags = tagCounts.slice(0, 5).map(([tag]) => tag);

      // Build match reason
      let matchReason = `${matchingTracks} of ${playlist.tracks.length} tracks match`;
      if (titleBoost > 0) {
        matchReason += '; title matches query';
      }

      scoredPlaylists.push({
        date: playlist.date,
        title: playlist.title,
        description: playlist.description?.substring(0, 200) || '',
        trackCount: playlist.tracks.length,
        matchScore: Math.round((matchScore + titleBoost) * 100) / 100,
        matchReason,
        sampleArtists: [...new Set(playlist.tracks.slice(0, 5).map((t) => t.artist))],
        dominantTags,
      });
    }
  }

  // Sort by match score
  scoredPlaylists.sort((a, b) => b.matchScore - a.matchScore);

  return {
    query,
    interpretedAs: {
      type: detectedType,
      mappedTags,
      description,
    },
    totalMatches: scoredPlaylists.length,
    suggestions: scoredPlaylists.slice(0, limit),
  };
}
