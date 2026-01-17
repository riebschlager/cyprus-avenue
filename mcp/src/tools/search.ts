// Core query tools (1-6)

import type { ArchiveData, Playlist, Track, ArtistBio, SpotifyTrack } from '../types.js';
import { findBestMatch, containsMatch, normalize } from '../utils/fuzzyMatch.js';
import { getSpotifyTrack, getArtistBio } from '../data/loader.js';

// 1. search_playlists - Search playlists by date range, title keywords, or description
export function searchPlaylists(
  data: ArchiveData,
  params: {
    query?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): {
  totalResults: number;
  playlists: {
    date: string;
    title: string;
    description: string;
    trackCount: number;
    sampleArtists: string[];
  }[];
} {
  const { query, startDate, endDate, limit = 20 } = params;

  let results = [...data.playlists];

  // Filter by date range
  if (startDate) {
    results = results.filter((p) => p.date >= startDate);
  }
  if (endDate) {
    results = results.filter((p) => p.date <= endDate);
  }

  // Filter by query (search in title and description)
  if (query) {
    const normalizedQuery = normalize(query);
    results = results.filter((p) => {
      const normalizedTitle = normalize(p.title);
      const normalizedDesc = normalize(p.description || '');
      return (
        normalizedTitle.includes(normalizedQuery) ||
        normalizedDesc.includes(normalizedQuery)
      );
    });
  }

  // Sort by date descending
  results.sort((a, b) => b.date.localeCompare(a.date));

  const totalResults = results.length;
  const limited = results.slice(0, limit);

  return {
    totalResults,
    playlists: limited.map((p) => ({
      date: p.date,
      title: p.title,
      description: p.description?.substring(0, 200) || '',
      trackCount: p.tracks.length,
      sampleArtists: [...new Set(p.tracks.slice(0, 5).map((t) => t.artist))],
    })),
  };
}

// 2. get_playlist - Get full playlist details including all tracks
export function getPlaylist(
  data: ArchiveData,
  params: { date: string }
): {
  found: boolean;
  playlist?: {
    date: string;
    title: string;
    description: string;
    source_url: string;
    tracks: {
      artist: string;
      song: string;
      spotifyUrl?: string;
      albumArt?: string;
    }[];
  };
  suggestions?: string[];
} {
  const { date } = params;

  const playlist = data.dateToPlaylist.get(date);

  if (!playlist) {
    // Find similar dates
    const allDates = [...data.dateToPlaylist.keys()].sort();
    const suggestions = allDates
      .filter((d) => d.startsWith(date.substring(0, 7))) // Same year-month
      .slice(0, 5);

    return {
      found: false,
      suggestions: suggestions.length > 0 ? suggestions : allDates.slice(-5),
    };
  }

  return {
    found: true,
    playlist: {
      date: playlist.date,
      title: playlist.title,
      description: playlist.description,
      source_url: playlist.source_url,
      tracks: playlist.tracks.map((t) => {
        const spotify = getSpotifyTrack(data, t.artist, t.song);
        return {
          artist: t.artist,
          song: t.song,
          spotifyUrl: spotify?.spotifyUrl,
          albumArt: spotify?.albumArt,
        };
      }),
    },
  };
}

// 3. search_artists - Search artists by name, bio content, or tags
export function searchArtists(
  data: ArchiveData,
  params: {
    query?: string;
    tags?: string[];
    minPopularity?: number;
    limit?: number;
  }
): {
  totalResults: number;
  artists: {
    name: string;
    tags: string[];
    popularity?: number;
    listeners?: number;
    playlistCount: number;
    spotifyUrl?: string;
    image?: string;
  }[];
} {
  const { query, tags, minPopularity, limit = 20 } = params;

  let results: string[] = [...data.allArtists];

  // Filter by query (search in name and bio)
  if (query) {
    const normalizedQuery = normalize(query);
    results = results.filter((artist) => {
      const normalizedName = normalize(artist);
      const bio = data.artistBios[artist];
      const normalizedBio = normalize(bio?.bio || '');

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedBio.includes(normalizedQuery)
      );
    });
  }

  // Filter by tags
  if (tags && tags.length > 0) {
    const normalizedTags = tags.map((t) => t.toLowerCase());
    results = results.filter((artist) => {
      const bio = data.artistBios[artist];
      const artistTags = (bio?.tags || []).map((t) => t.toLowerCase());
      return normalizedTags.some((tag) => artistTags.includes(tag));
    });
  }

  // Filter by popularity
  if (minPopularity !== undefined) {
    results = results.filter((artist) => {
      const bio = data.artistBios[artist];
      return bio?.popularity !== undefined && bio.popularity >= minPopularity;
    });
  }

  // Sort by playlist count
  results.sort((a, b) => {
    const countA = data.artistToPlaylists.get(a)?.length || 0;
    const countB = data.artistToPlaylists.get(b)?.length || 0;
    return countB - countA;
  });

  const totalResults = results.length;
  const limited = results.slice(0, limit);

  return {
    totalResults,
    artists: limited.map((name) => {
      const bio = data.artistBios[name];
      const appearances = data.artistToPlaylists.get(name) || [];
      return {
        name,
        tags: bio?.tags || [],
        popularity: bio?.popularity,
        listeners: bio?.listeners,
        playlistCount: appearances.length,
        spotifyUrl: bio?.spotifyUrl,
        image: bio?.image,
      };
    }),
  };
}

// 4. get_artist - Get detailed artist profile with all appearances
export function getArtist(
  data: ArchiveData,
  params: { name: string }
): {
  found: boolean;
  artist?: {
    name: string;
    bio?: string;
    bioSummary?: string;
    tags: string[];
    image?: string;
    spotifyUrl?: string;
    lastfmUrl?: string;
    listeners?: number;
    playcount?: number;
    popularity?: number;
    followers?: number;
    appearances: {
      date: string;
      title: string;
      songs: { song: string; spotifyUrl?: string }[];
    }[];
    totalTracks: number;
    uniqueSongs: number;
  };
  suggestions?: string[];
} {
  const { name } = params;

  // Try exact match first
  let artistName = name;
  let bio = data.artistBios[name];
  let appearances = data.artistToPlaylists.get(name);

  // If not found, try fuzzy match
  if (!appearances) {
    const match = findBestMatch(name, data.allArtists);
    if (match.match) {
      artistName = match.match;
      bio = data.artistBios[artistName];
      appearances = data.artistToPlaylists.get(artistName);
    } else {
      return {
        found: false,
        suggestions: match.suggestions,
      };
    }
  }

  if (!appearances || appearances.length === 0) {
    return {
      found: false,
      suggestions: containsMatch(name, data.allArtists).slice(0, 5),
    };
  }

  // Calculate total tracks and unique songs
  const allSongs = appearances.flatMap((a) => a.songs);
  const uniqueSongs = [...new Set(allSongs)];

  return {
    found: true,
    artist: {
      name: artistName,
      bio: bio?.bio,
      bioSummary: bio?.bioSummary?.replace(/<a[^>]*>.*?<\/a>/g, '').trim(),
      tags: bio?.tags || [],
      image: bio?.image,
      spotifyUrl: bio?.spotifyUrl,
      lastfmUrl: bio?.url,
      listeners: bio?.listeners,
      playcount: bio?.playcount,
      popularity: bio?.popularity,
      followers: bio?.followers,
      appearances: appearances.map((a) => ({
        date: a.date,
        title: a.title,
        songs: a.songs.map((song) => {
          const spotify = getSpotifyTrack(data, artistName, song);
          return {
            song,
            spotifyUrl: spotify?.spotifyUrl,
          };
        }),
      })),
      totalTracks: allSongs.length,
      uniqueSongs: uniqueSongs.length,
    },
  };
}

// 5. search_tracks - Search tracks by artist, song name, or genre
export function searchTracks(
  data: ArchiveData,
  params: {
    query?: string;
    artist?: string;
    genres?: string[];
    limit?: number;
  }
): {
  totalResults: number;
  tracks: {
    artist: string;
    song: string;
    playlistDate: string;
    playlistTitle: string;
    spotifyUrl?: string;
    albumArt?: string;
    genres?: string[];
  }[];
} {
  const { query, artist, genres, limit = 50 } = params;

  // Collect all tracks with playlist info
  const allTracks: {
    artist: string;
    song: string;
    playlistDate: string;
    playlistTitle: string;
  }[] = [];

  for (const playlist of data.playlists) {
    for (const track of playlist.tracks) {
      allTracks.push({
        artist: track.artist,
        song: track.song,
        playlistDate: playlist.date,
        playlistTitle: playlist.title,
      });
    }
  }

  let results = allTracks;

  // Filter by artist
  if (artist) {
    const normalizedArtist = normalize(artist);
    results = results.filter((t) => normalize(t.artist).includes(normalizedArtist));
  }

  // Filter by query (search in song name)
  if (query) {
    const normalizedQuery = normalize(query);
    results = results.filter(
      (t) =>
        normalize(t.song).includes(normalizedQuery) ||
        normalize(t.artist).includes(normalizedQuery)
    );
  }

  // Filter by genres
  if (genres && genres.length > 0) {
    const normalizedGenres = genres.map((g) => g.toLowerCase());
    results = results.filter((t) => {
      const spotify = data.spotifyIndex[`${t.artist}|${t.song}`];
      const trackGenres = spotify?.genres || [];
      return normalizedGenres.some((g) =>
        trackGenres.some((tg) => tg.toLowerCase().includes(g))
      );
    });
  }

  // Deduplicate by artist|song
  const seen = new Set<string>();
  const deduped = results.filter((t) => {
    const key = `${t.artist}|${t.song}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const totalResults = deduped.length;
  const limited = deduped.slice(0, limit);

  return {
    totalResults,
    tracks: limited.map((t) => {
      const spotify = data.spotifyIndex[`${t.artist}|${t.song}`];
      return {
        artist: t.artist,
        song: t.song,
        playlistDate: t.playlistDate,
        playlistTitle: t.playlistTitle,
        spotifyUrl: spotify?.spotifyUrl,
        albumArt: spotify?.albumArt,
        genres: spotify?.genres,
      };
    }),
  };
}

// 6. get_track - Get track details including Spotify data
export function getTrack(
  data: ArchiveData,
  params: { artist: string; song: string }
): {
  found: boolean;
  track?: {
    artist: string;
    song: string;
    spotifyUrl?: string;
    previewUrl?: string;
    albumArt?: string;
    genres?: string[];
    confidence?: string;
    appearances: { date: string; title: string }[];
  };
  suggestions?: { artist: string; song: string }[];
} {
  const { artist, song } = params;

  // Find appearances
  const appearances: { date: string; title: string }[] = [];
  for (const playlist of data.playlists) {
    for (const track of playlist.tracks) {
      if (
        normalize(track.artist) === normalize(artist) &&
        normalize(track.song) === normalize(song)
      ) {
        appearances.push({ date: playlist.date, title: playlist.title });
      }
    }
  }

  if (appearances.length === 0) {
    // Try to find similar tracks
    const artistTracks = data.artistToPlaylists.get(artist);
    if (artistTracks) {
      const allSongs = artistTracks.flatMap((a) => a.songs);
      const suggestions = [...new Set(allSongs)]
        .slice(0, 5)
        .map((s) => ({ artist, song: s }));
      return { found: false, suggestions };
    }
    return { found: false };
  }

  const spotify = data.spotifyIndex[`${artist}|${song}`];

  return {
    found: true,
    track: {
      artist,
      song,
      spotifyUrl: spotify?.spotifyUrl,
      previewUrl: spotify?.previewUrl,
      albumArt: spotify?.albumArt,
      genres: spotify?.genres,
      confidence: spotify?.confidence,
      appearances,
    },
  };
}
