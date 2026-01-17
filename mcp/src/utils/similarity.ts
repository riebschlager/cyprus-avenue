// Tag similarity and connection scoring utilities

import type { ArtistBio, ArchiveData, ArtistConnection } from '../types.js';

// Calculate Jaccard similarity between two tag sets
export function tagSimilarity(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 && tags2.length === 0) return 0;

  const set1 = new Set(tags1.map((t) => t.toLowerCase()));
  const set2 = new Set(tags2.map((t) => t.toLowerCase()));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

// Get shared tags between two tag arrays
export function getSharedTags(tags1: string[], tags2: string[]): string[] {
  const set1 = new Set(tags1.map((t) => t.toLowerCase()));
  const set2 = new Set(tags2.map((t) => t.toLowerCase()));

  return [...set1].filter((x) => set2.has(x));
}

// Calculate artist connection strength
// Formula: (coOccurrences × 0.6) + (normalizedSharedTags × 0.4)
export function calculateConnectionStrength(
  coOccurrences: number,
  sharedTagCount: number,
  maxCoOccurrences: number,
  maxTags: number
): number {
  const normalizedCoOcc = maxCoOccurrences > 0 ? coOccurrences / maxCoOccurrences : 0;
  const normalizedTags = maxTags > 0 ? sharedTagCount / maxTags : 0;

  return normalizedCoOcc * 0.6 + normalizedTags * 0.4;
}

// Find connected artists for a given artist
export function findArtistConnections(
  data: ArchiveData,
  artistName: string,
  minCoOccurrences = 1,
  limit = 20
): ArtistConnection[] {
  const artistBio = data.artistBios[artistName];
  const artistTags = artistBio?.tags || [];

  const connections: ArtistConnection[] = [];

  // Check both directions in co-occurrence matrix
  for (const [artist1, innerMap] of data.coOccurrenceMatrix) {
    if (artist1 === artistName) {
      // Artist is the first in the pair
      for (const [artist2, occData] of innerMap) {
        if (occData.count >= minCoOccurrences) {
          const otherBio = data.artistBios[artist2];
          const otherTags = otherBio?.tags || [];
          const sharedTags = getSharedTags(artistTags, otherTags);

          connections.push({
            artist: artist2,
            coOccurrences: occData.count,
            sharedPlaylists: occData.playlists,
            sharedTags,
            connectionStrength: 0, // Will be calculated after
          });
        }
      }
    } else {
      // Check if artist is the second in any pair
      const occData = innerMap.get(artistName);
      if (occData && occData.count >= minCoOccurrences) {
        const otherBio = data.artistBios[artist1];
        const otherTags = otherBio?.tags || [];
        const sharedTags = getSharedTags(artistTags, otherTags);

        connections.push({
          artist: artist1,
          coOccurrences: occData.count,
          sharedPlaylists: occData.playlists,
          sharedTags,
          connectionStrength: 0,
        });
      }
    }
  }

  if (connections.length === 0) {
    return [];
  }

  // Calculate connection strength
  const maxCoOcc = Math.max(...connections.map((c) => c.coOccurrences));
  const maxTags = Math.max(...connections.map((c) => c.sharedTags.length), 1);

  for (const conn of connections) {
    conn.connectionStrength = calculateConnectionStrength(
      conn.coOccurrences,
      conn.sharedTags.length,
      maxCoOcc,
      maxTags
    );
  }

  // Sort by connection strength
  connections.sort((a, b) => b.connectionStrength - a.connectionStrength);

  return connections.slice(0, limit);
}

// Find similar artists based on tags
export function findSimilarArtists(
  data: ArchiveData,
  artistName: string,
  limit = 20
): { artist: string; similarity: number; sharedTags: string[] }[] {
  const artistBio = data.artistBios[artistName];
  if (!artistBio || !artistBio.tags || artistBio.tags.length === 0) {
    return [];
  }

  const artistTags = artistBio.tags;
  const results: { artist: string; similarity: number; sharedTags: string[] }[] = [];

  for (const [otherArtist, otherBio] of Object.entries(data.artistBios)) {
    if (otherArtist === artistName) continue;
    if (!otherBio.tags || otherBio.tags.length === 0) continue;

    const sim = tagSimilarity(artistTags, otherBio.tags);
    if (sim > 0) {
      results.push({
        artist: otherArtist,
        similarity: sim,
        sharedTags: getSharedTags(artistTags, otherBio.tags),
      });
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit);
}
