// Output formatting utilities for markdown and JSON

import type { Playlist, ArtistBio, SpotifyTrack, ArtistAppearance } from '../types.js';

// Format a track with optional Spotify link
export function formatTrack(
  artist: string,
  song: string,
  spotifyTrack?: SpotifyTrack,
  includeLinks = true
): string {
  const base = `${artist} - "${song}"`;
  if (includeLinks && spotifyTrack?.spotifyUrl) {
    return `${base} [Spotify](${spotifyTrack.spotifyUrl})`;
  }
  return base;
}

// Format a playlist as markdown
export function formatPlaylistMarkdown(
  playlist: Playlist,
  spotifyIndex: Record<string, SpotifyTrack>,
  includeLinks = true
): string {
  const lines: string[] = [];

  lines.push(`# ${playlist.title}`);
  lines.push('');
  lines.push(`**Date:** ${playlist.date}`);
  lines.push('');

  if (playlist.description) {
    lines.push('## Description');
    lines.push('');
    lines.push(playlist.description);
    lines.push('');
  }

  lines.push('## Tracks');
  lines.push('');

  for (let i = 0; i < playlist.tracks.length; i++) {
    const track = playlist.tracks[i];
    const spotifyTrack = spotifyIndex[`${track.artist}|${track.song}`];
    const formatted = formatTrack(track.artist, track.song, spotifyTrack, includeLinks);
    lines.push(`${i + 1}. ${formatted}`);
  }

  lines.push('');
  lines.push(`**Source:** ${playlist.source_url}`);

  return lines.join('\n');
}

// Format an artist profile as markdown
export function formatArtistMarkdown(
  artistName: string,
  bio: ArtistBio | undefined,
  appearances: ArtistAppearance[],
  spotifyIndex: Record<string, SpotifyTrack>
): string {
  const lines: string[] = [];

  lines.push(`# ${artistName}`);
  lines.push('');

  if (bio?.image) {
    lines.push(`![${artistName}](${bio.image})`);
    lines.push('');
  }

  // Stats
  if (bio) {
    lines.push('## Stats');
    lines.push('');
    if (bio.listeners) lines.push(`- **Last.fm Listeners:** ${bio.listeners.toLocaleString()}`);
    if (bio.playcount) lines.push(`- **Last.fm Plays:** ${bio.playcount.toLocaleString()}`);
    if (bio.followers) lines.push(`- **Spotify Followers:** ${bio.followers.toLocaleString()}`);
    if (bio.popularity) lines.push(`- **Spotify Popularity:** ${bio.popularity}/100`);
    lines.push('');
  }

  // Tags
  if (bio?.tags && bio.tags.length > 0) {
    lines.push('## Tags');
    lines.push('');
    lines.push(bio.tags.join(', '));
    lines.push('');
  }

  // Bio
  if (bio?.bio) {
    lines.push('## Biography');
    lines.push('');
    lines.push(bio.bio);
    lines.push('');
  }

  // Links
  lines.push('## Links');
  lines.push('');
  if (bio?.spotifyUrl) lines.push(`- [Spotify](${bio.spotifyUrl})`);
  if (bio?.url) lines.push(`- [Last.fm](${bio.url})`);
  lines.push('');

  // Appearances
  lines.push('## Cyprus Avenue Appearances');
  lines.push('');

  // Sort by date
  const sortedAppearances = [...appearances].sort((a, b) => a.date.localeCompare(b.date));

  for (const appearance of sortedAppearances) {
    lines.push(`### ${appearance.date} - ${appearance.title}`);
    lines.push('');
    for (const song of appearance.songs) {
      const spotifyTrack = spotifyIndex[`${artistName}|${song}`];
      if (spotifyTrack?.spotifyUrl) {
        lines.push(`- "${song}" [Spotify](${spotifyTrack.spotifyUrl})`);
      } else {
        lines.push(`- "${song}"`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Format discovery report as markdown
export function formatDiscoveryReportMarkdown(
  title: string,
  tags: string[],
  artists: { name: string; bio?: ArtistBio; trackCount: number }[],
  spotifyIndex: Record<string, SpotifyTrack>,
  artistToPlaylists: Map<string, ArtistAppearance[]>
): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`**Tags:** ${tags.join(', ')}`);
  lines.push('');
  lines.push(`**Artists Found:** ${artists.length}`);
  lines.push('');

  for (const artist of artists) {
    lines.push(`## ${artist.name}`);
    lines.push('');

    if (artist.bio?.image) {
      lines.push(`![${artist.name}](${artist.bio.image})`);
      lines.push('');
    }

    if (artist.bio?.bioSummary) {
      // Remove HTML link from bio summary
      const cleanBio = artist.bio.bioSummary.replace(/<a[^>]*>.*?<\/a>/g, '').trim();
      lines.push(cleanBio);
      lines.push('');
    }

    if (artist.bio?.spotifyUrl) {
      lines.push(`[Listen on Spotify](${artist.bio.spotifyUrl})`);
      lines.push('');
    }

    // Show sample tracks
    const appearances = artistToPlaylists.get(artist.name) || [];
    const allSongs = appearances.flatMap((a) => a.songs);
    const uniqueSongs = [...new Set(allSongs)].slice(0, 5);

    if (uniqueSongs.length > 0) {
      lines.push('**Sample Tracks:**');
      for (const song of uniqueSongs) {
        const spotifyTrack = spotifyIndex[`${artist.name}|${song}`];
        if (spotifyTrack?.spotifyUrl) {
          lines.push(`- "${song}" [Spotify](${spotifyTrack.spotifyUrl})`);
        } else {
          lines.push(`- "${song}"`);
        }
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

// Format year in review as markdown
export function formatYearInReviewMarkdown(
  year: number,
  playlists: Playlist[],
  topArtists: { artist: string; count: number }[],
  topTags: { tag: string; count: number }[]
): string {
  const lines: string[] = [];

  lines.push(`# Cyprus Avenue ${year} Year in Review`);
  lines.push('');
  lines.push(`**Total Shows:** ${playlists.length}`);
  lines.push(`**Total Tracks:** ${playlists.reduce((sum, p) => sum + p.tracks.length, 0)}`);
  lines.push('');

  // Top Artists
  lines.push('## Most Featured Artists');
  lines.push('');
  for (let i = 0; i < Math.min(topArtists.length, 10); i++) {
    const artist = topArtists[i];
    lines.push(`${i + 1}. **${artist.artist}** (${artist.count} tracks)`);
  }
  lines.push('');

  // Top Genres
  lines.push('## Top Genres');
  lines.push('');
  for (let i = 0; i < Math.min(topTags.length, 10); i++) {
    const tag = topTags[i];
    lines.push(`${i + 1}. **${tag.tag}** (${tag.count} tracks)`);
  }
  lines.push('');

  // All playlists
  lines.push('## All Shows');
  lines.push('');

  const sortedPlaylists = [...playlists].sort((a, b) => a.date.localeCompare(b.date));
  for (const playlist of sortedPlaylists) {
    lines.push(`### ${playlist.date} - ${playlist.title}`);
    lines.push('');
    lines.push(`${playlist.tracks.length} tracks`);
    if (playlist.description) {
      const shortDesc = playlist.description.substring(0, 200);
      lines.push(`> ${shortDesc}${playlist.description.length > 200 ? '...' : ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
