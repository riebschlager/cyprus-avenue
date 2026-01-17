import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type {
  ArchiveData,
  Playlist,
  ArtistBio,
  SpotifyTrack,
  ArtistAppearance,
} from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Determine data directory - works in both dev and Docker
function getDataDir(): string {
  // In Docker, data is at /app/data
  // In dev, data is at project root
  const dockerPath = '/app/data';
  const devPlaylistsPath = join(__dirname, '..', '..', '..', 'json', 'playlists.json');

  try {
    readFileSync(join(dockerPath, 'playlists.json'));
    return dockerPath;
  } catch {
    // Dev mode - return paths relative to project
    return '';
  }
}

function loadJSON<T>(filename: string, fallbackPath?: string): T {
  const dataDir = getDataDir();

  let filePath: string;
  if (dataDir) {
    filePath = join(dataDir, filename);
  } else if (fallbackPath) {
    filePath = join(__dirname, '..', '..', '..', fallbackPath);
  } else {
    throw new Error(`Cannot find data file: ${filename}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// Build artist-to-playlists index
function buildArtistIndex(playlists: Playlist[]): Map<string, ArtistAppearance[]> {
  const index = new Map<string, ArtistAppearance[]>();

  for (const playlist of playlists) {
    const artistSongs = new Map<string, string[]>();

    for (const track of playlist.tracks) {
      const existing = artistSongs.get(track.artist) || [];
      existing.push(track.song);
      artistSongs.set(track.artist, existing);
    }

    for (const [artist, songs] of artistSongs) {
      const appearances = index.get(artist) || [];
      appearances.push({
        date: playlist.date,
        title: playlist.title,
        songs,
      });
      index.set(artist, appearances);
    }
  }

  return index;
}

// Build tag-to-artists index
function buildTagIndex(artistBios: Record<string, ArtistBio>): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();

  for (const [artist, bio] of Object.entries(artistBios)) {
    const tags = bio.tags || [];
    for (const tag of tags) {
      const normalizedTag = tag.toLowerCase();
      const artists = index.get(normalizedTag) || new Set();
      artists.add(artist);
      index.set(normalizedTag, artists);
    }
  }

  return index;
}

// Build date-to-playlist index
function buildDateIndex(playlists: Playlist[]): Map<string, Playlist> {
  const index = new Map<string, Playlist>();
  for (const playlist of playlists) {
    index.set(playlist.date, playlist);
  }
  return index;
}

// Build co-occurrence matrix for artist connections
function buildCoOccurrenceMatrix(
  playlists: Playlist[]
): Map<string, Map<string, { count: number; playlists: { date: string; title: string }[] }>> {
  const matrix = new Map<string, Map<string, { count: number; playlists: { date: string; title: string }[] }>>();

  for (const playlist of playlists) {
    // Get unique artists in this playlist
    const artists = [...new Set(playlist.tracks.map((t) => t.artist))];

    // Create pairs
    for (let i = 0; i < artists.length; i++) {
      for (let j = i + 1; j < artists.length; j++) {
        const artist1 = artists[i];
        const artist2 = artists[j];

        // Ensure consistent ordering
        const [a, b] = artist1 < artist2 ? [artist1, artist2] : [artist2, artist1];

        if (!matrix.has(a)) {
          matrix.set(a, new Map());
        }

        const innerMap = matrix.get(a)!;
        const existing = innerMap.get(b) || { count: 0, playlists: [] };
        existing.count++;
        existing.playlists.push({ date: playlist.date, title: playlist.title });
        innerMap.set(b, existing);
      }
    }
  }

  return matrix;
}

// Extract all unique artists
function extractAllArtists(playlists: Playlist[]): string[] {
  const artists = new Set<string>();
  for (const playlist of playlists) {
    for (const track of playlist.tracks) {
      artists.add(track.artist);
    }
  }
  return [...artists].sort();
}

// Extract all unique tags
function extractAllTags(artistBios: Record<string, ArtistBio>): string[] {
  const tags = new Set<string>();
  for (const bio of Object.values(artistBios)) {
    for (const tag of bio.tags || []) {
      tags.add(tag.toLowerCase());
    }
  }
  return [...tags].sort();
}

let cachedData: ArchiveData | null = null;

export function loadArchiveData(): ArchiveData {
  if (cachedData) {
    return cachedData;
  }

  console.error('Loading Cyprus Avenue archive data...');

  // Load raw data
  const playlists = loadJSON<Playlist[]>('playlists.json', 'json/playlists.json');
  const artistBios = loadJSON<Record<string, ArtistBio>>('artist-bios.json', 'web/public/artist-bios.json');
  const spotifyIndex = loadJSON<Record<string, SpotifyTrack>>('spotify-index.json', 'web/public/spotify-index.json');

  console.error(`Loaded ${playlists.length} playlists`);
  console.error(`Loaded ${Object.keys(artistBios).length} artist bios`);
  console.error(`Loaded ${Object.keys(spotifyIndex).length} Spotify tracks`);

  // Build indexes
  console.error('Building indexes...');
  const artistToPlaylists = buildArtistIndex(playlists);
  const tagToArtists = buildTagIndex(artistBios);
  const dateToPlaylist = buildDateIndex(playlists);
  const allArtists = extractAllArtists(playlists);
  const allTags = extractAllTags(artistBios);
  const coOccurrenceMatrix = buildCoOccurrenceMatrix(playlists);

  console.error(`Indexed ${artistToPlaylists.size} artists`);
  console.error(`Indexed ${tagToArtists.size} tags`);
  console.error('Archive data loaded successfully');

  cachedData = {
    playlists,
    artistBios,
    spotifyIndex,
    artistToPlaylists,
    tagToArtists,
    dateToPlaylist,
    allArtists,
    allTags,
    coOccurrenceMatrix,
  };

  return cachedData;
}

// Helper to get Spotify data for a track
export function getSpotifyTrack(
  data: ArchiveData,
  artist: string,
  song: string
): SpotifyTrack | undefined {
  const key = `${artist}|${song}`;
  return data.spotifyIndex[key];
}

// Helper to get artist bio
export function getArtistBio(data: ArchiveData, artist: string): ArtistBio | undefined {
  return data.artistBios[artist];
}
