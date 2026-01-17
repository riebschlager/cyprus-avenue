// Artifact generation tools (18-21)
// All tools return both markdown and json formats

import type { ArchiveData, Playlist, ArtistBio, SpotifyTrack } from '../types.js';
import { findBestMatch } from '../utils/fuzzyMatch.js';
import {
  formatPlaylistMarkdown,
  formatArtistMarkdown,
  formatDiscoveryReportMarkdown,
  formatYearInReviewMarkdown,
} from '../utils/formatters.js';
import { discoverByTag } from './discovery.js';
import { analyzeTopArtists } from './analysis.js';

// 18. generate_playlist_document - Create shareable playlist document
export function generatePlaylistDocument(
  data: ArchiveData,
  params: { date: string; includeSpotifyLinks?: boolean }
): {
  success: boolean;
  error?: string;
  markdown?: string;
  json?: {
    date: string;
    title: string;
    description: string;
    source_url: string;
    tracks: {
      position: number;
      artist: string;
      song: string;
      spotifyUrl?: string;
      albumArt?: string;
    }[];
  };
} {
  const { date, includeSpotifyLinks = true } = params;

  const playlist = data.dateToPlaylist.get(date);
  if (!playlist) {
    const allDates = [...data.dateToPlaylist.keys()].sort();
    const suggestions = allDates.filter((d) => d.startsWith(date.substring(0, 7))).slice(0, 5);
    return {
      success: false,
      error: `Playlist not found for date ${date}. ${suggestions.length > 0 ? `Did you mean: ${suggestions.join(', ')}?` : ''}`,
    };
  }

  const markdown = formatPlaylistMarkdown(playlist, data.spotifyIndex, includeSpotifyLinks);

  const json = {
    date: playlist.date,
    title: playlist.title,
    description: playlist.description,
    source_url: playlist.source_url,
    tracks: playlist.tracks.map((t, i) => {
      const spotify = data.spotifyIndex[`${t.artist}|${t.song}`];
      return {
        position: i + 1,
        artist: t.artist,
        song: t.song,
        spotifyUrl: includeSpotifyLinks ? spotify?.spotifyUrl : undefined,
        albumArt: spotify?.albumArt,
      };
    }),
  };

  return { success: true, markdown, json };
}

// 19. generate_artist_profile - Create artist research document
export function generateArtistProfile(
  data: ArchiveData,
  params: { artist: string }
): {
  success: boolean;
  error?: string;
  suggestions?: string[];
  markdown?: string;
  json?: {
    name: string;
    bio?: string;
    tags: string[];
    image?: string;
    spotifyUrl?: string;
    lastfmUrl?: string;
    stats: {
      listeners?: number;
      playcount?: number;
      popularity?: number;
      followers?: number;
    };
    cyprusAvenueStats: {
      totalAppearances: number;
      uniqueSongs: number;
      playlistCount: number;
      dateRange: { first: string; last: string };
    };
    appearances: {
      date: string;
      title: string;
      songs: { song: string; spotifyUrl?: string }[];
    }[];
  };
} {
  const { artist } = params;

  // Find artist
  let artistName = artist;
  let bio = data.artistBios[artist];
  let appearances = data.artistToPlaylists.get(artist);

  if (!appearances) {
    const match = findBestMatch(artist, data.allArtists);
    if (match.match) {
      artistName = match.match;
      bio = data.artistBios[artistName];
      appearances = data.artistToPlaylists.get(artistName);
    } else {
      return {
        success: false,
        error: `Artist "${artist}" not found in archive.`,
        suggestions: match.suggestions,
      };
    }
  }

  if (!appearances || appearances.length === 0) {
    return {
      success: false,
      error: `No appearances found for "${artistName}".`,
    };
  }

  const markdown = formatArtistMarkdown(artistName, bio, appearances, data.spotifyIndex);

  // Calculate stats
  const allSongs = appearances.flatMap((a) => a.songs);
  const uniqueSongs = [...new Set(allSongs)];
  const sortedDates = appearances.map((a) => a.date).sort();

  const json = {
    name: artistName,
    bio: bio?.bio,
    tags: bio?.tags || [],
    image: bio?.image,
    spotifyUrl: bio?.spotifyUrl,
    lastfmUrl: bio?.url,
    stats: {
      listeners: bio?.listeners,
      playcount: bio?.playcount,
      popularity: bio?.popularity,
      followers: bio?.followers,
    },
    cyprusAvenueStats: {
      totalAppearances: allSongs.length,
      uniqueSongs: uniqueSongs.length,
      playlistCount: appearances.length,
      dateRange: {
        first: sortedDates[0],
        last: sortedDates[sortedDates.length - 1],
      },
    },
    appearances: appearances.map((a) => ({
      date: a.date,
      title: a.title,
      songs: a.songs.map((song) => {
        const spotify = data.spotifyIndex[`${artistName}|${song}`];
        return {
          song,
          spotifyUrl: spotify?.spotifyUrl,
        };
      }),
    })),
  };

  return { success: true, markdown, json };
}

// 20. generate_discovery_report - Create themed music discovery document
export function generateDiscoveryReport(
  data: ArchiveData,
  params: { tags: string[]; title?: string }
): {
  success: boolean;
  error?: string;
  markdown?: string;
  json?: {
    title: string;
    tags: string[];
    generatedAt: string;
    artistCount: number;
    artists: {
      name: string;
      bio?: string;
      tags: string[];
      image?: string;
      spotifyUrl?: string;
      trackCount: number;
      sampleTracks: { song: string; spotifyUrl?: string }[];
    }[];
  };
} {
  const { tags, title } = params;

  if (!tags || tags.length === 0) {
    return {
      success: false,
      error: 'At least one tag is required for discovery.',
    };
  }

  const discovery = discoverByTag(data, { tags, matchAll: false, limit: 50 });

  if (discovery.artists.length === 0) {
    return {
      success: false,
      error: `No artists found matching tags: ${tags.join(', ')}`,
    };
  }

  const reportTitle = title || `${tags.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' & ')} Music in Cyprus Avenue`;

  // Build artist data with sample tracks
  const artistsData = discovery.artists.map((a) => {
    const bio = data.artistBios[a.name];
    const appearances = data.artistToPlaylists.get(a.name) || [];
    const allSongs = appearances.flatMap((app) => app.songs);
    const uniqueSongs = [...new Set(allSongs)].slice(0, 5);

    return {
      name: a.name,
      bio: bio,
      trackCount: a.trackCount,
      sampleTracks: uniqueSongs.map((song) => {
        const spotify = data.spotifyIndex[`${a.name}|${song}`];
        return { song, spotifyUrl: spotify?.spotifyUrl };
      }),
    };
  });

  const markdown = formatDiscoveryReportMarkdown(
    reportTitle,
    tags,
    artistsData.map((a) => ({ name: a.name, bio: a.bio, trackCount: a.trackCount })),
    data.spotifyIndex,
    data.artistToPlaylists
  );

  const json = {
    title: reportTitle,
    tags,
    generatedAt: new Date().toISOString(),
    artistCount: discovery.artists.length,
    artists: artistsData.map((a) => ({
      name: a.name,
      bio: a.bio?.bioSummary?.replace(/<a[^>]*>.*?<\/a>/g, '').trim(),
      tags: a.bio?.tags || [],
      image: a.bio?.image,
      spotifyUrl: a.bio?.spotifyUrl,
      trackCount: a.trackCount,
      sampleTracks: a.sampleTracks,
    })),
  };

  return { success: true, markdown, json };
}

// 21. generate_year_in_review - Create annual summary document
export function generateYearInReview(
  data: ArchiveData,
  params: { year: number }
): {
  success: boolean;
  error?: string;
  markdown?: string;
  json?: {
    year: number;
    generatedAt: string;
    summary: {
      playlistCount: number;
      trackCount: number;
      artistCount: number;
    };
    topArtists: { artist: string; trackCount: number }[];
    topGenres: { tag: string; trackCount: number; percentage: number }[];
    playlists: {
      date: string;
      title: string;
      trackCount: number;
      description?: string;
    }[];
  };
} {
  const { year } = params;

  // Filter playlists for this year
  const yearPlaylists = data.playlists.filter(
    (p) => parseInt(p.date.split('-')[0]) === year
  );

  if (yearPlaylists.length === 0) {
    const availableYears = [
      ...new Set(data.playlists.map((p) => parseInt(p.date.split('-')[0]))),
    ].sort();
    return {
      success: false,
      error: `No playlists found for year ${year}. Available years: ${availableYears.join(', ')}`,
    };
  }

  // Count artists
  const artistCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  let totalTracks = 0;
  const uniqueArtists = new Set<string>();

  for (const playlist of yearPlaylists) {
    for (const track of playlist.tracks) {
      totalTracks++;
      uniqueArtists.add(track.artist);
      artistCounts.set(track.artist, (artistCounts.get(track.artist) || 0) + 1);

      const bio = data.artistBios[track.artist];
      for (const tag of bio?.tags || []) {
        const normalizedTag = tag.toLowerCase();
        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
      }
    }
  }

  // Sort artists and tags
  const topArtists = [...artistCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([artist, count]) => ({ artist, count }));

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const markdown = formatYearInReviewMarkdown(year, yearPlaylists, topArtists, topTags);

  const json = {
    year,
    generatedAt: new Date().toISOString(),
    summary: {
      playlistCount: yearPlaylists.length,
      trackCount: totalTracks,
      artistCount: uniqueArtists.size,
    },
    topArtists: topArtists.map((a) => ({ artist: a.artist, trackCount: a.count })),
    topGenres: topTags.map((t) => ({
      tag: t.tag,
      trackCount: t.count,
      percentage: Math.round((t.count / totalTracks) * 100 * 10) / 10,
    })),
    playlists: yearPlaylists
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({
        date: p.date,
        title: p.title,
        trackCount: p.tracks.length,
        description: p.description?.substring(0, 200),
      })),
  };

  return { success: true, markdown, json };
}
