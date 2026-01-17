// Core data types matching the archive JSON structure

export interface Track {
  artist: string;
  song: string;
  genres?: string[];
}

export interface Playlist {
  date: string;
  title: string;
  description: string;
  tracks: Track[];
  source_url: string;
  archived_date: string;
}

export interface ArtistBio {
  bio?: string;
  bioSummary?: string;
  tags?: string[];
  lastfmTags?: string[];
  url?: string;
  image?: string;
  listeners?: number;
  playcount?: number;
  spotifyId?: string;
  spotifyUrl?: string;
  popularity?: number;
  followers?: number;
  genres?: string[];
  genreSources?: {
    lastfm?: number;
    spotifyArtist?: number;
    spotifyTracks?: number;
    total?: number;
  };
  tagSources?: {
    lastfm?: number;
    spotifyArtist?: number;
    spotifyTracks?: number;
    total?: number;
  };
}

export interface SpotifyTrack {
  spotifyId: string;
  spotifyUrl: string;
  previewUrl?: string;
  albumArt?: string;
  artistName: string;
  trackName: string;
  genres?: string[];
  confidence: 'high' | 'medium';
}

// Index types for fast lookups
export interface ArtistAppearance {
  date: string;
  title: string;
  songs: string[];
}

export interface ArtistConnection {
  artist: string;
  coOccurrences: number;
  sharedPlaylists: { date: string; title: string }[];
  sharedTags: string[];
  connectionStrength: number;
}

export interface PlaylistSuggestion {
  date: string;
  title: string;
  description: string;
  trackCount: number;
  matchScore: number;
  matchReason: string;
  sampleArtists: string[];
  dominantTags: string[];
}

export interface TopArtist {
  artist: string;
  totalAppearances: number;
  uniqueSongs: number;
  playlistCount: number;
  firstAppearance: string;
  lastAppearance: string;
  mostCommonTags: string[];
  dedicatedShows: { date: string; title: string }[];
}

export interface GenreTrend {
  year: number;
  playlistCount: number;
  dominantGenres: { tag: string; trackCount: number; percentage: number }[];
  risingGenres: string[];
  decliningGenres: string[];
}

export interface ThemeAnalysis {
  theme: string;
  description: string;
  playlistCount: number;
  examples: { date: string; title: string }[];
}

// Archive data with indexes
export interface ArchiveData {
  playlists: Playlist[];
  artistBios: Record<string, ArtistBio>;
  spotifyIndex: Record<string, SpotifyTrack>;

  // Pre-computed indexes
  artistToPlaylists: Map<string, ArtistAppearance[]>;
  tagToArtists: Map<string, Set<string>>;
  dateToPlaylist: Map<string, Playlist>;
  allArtists: string[];
  allTags: string[];
  coOccurrenceMatrix: Map<string, Map<string, { count: number; playlists: { date: string; title: string }[] }>>;
}
