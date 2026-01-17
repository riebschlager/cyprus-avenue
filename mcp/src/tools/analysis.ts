// Curation analysis tools (13-17)

import type { ArchiveData, TopArtist, GenreTrend, ThemeAnalysis } from '../types.js';

// 13. get_statistics - Get archive overview statistics
export function getStatistics(data: ArchiveData): {
  playlists: {
    total: number;
    dateRange: { earliest: string; latest: string };
    totalTracks: number;
    averageTracksPerPlaylist: number;
  };
  artists: {
    total: number;
    withBios: number;
    withImages: number;
  };
  tracks: {
    total: number;
    unique: number;
    spotifyIndexed: number;
    spotifyCoverage: string;
  };
  tags: {
    total: number;
    topTags: { tag: string; artistCount: number }[];
  };
} {
  // Playlist stats
  const sortedDates = data.playlists.map((p) => p.date).sort();
  const totalTracks = data.playlists.reduce((sum, p) => sum + p.tracks.length, 0);

  // Artist stats
  const artistsWithBios = Object.values(data.artistBios).filter((b) => b.bio).length;
  const artistsWithImages = Object.values(data.artistBios).filter((b) => b.image).length;

  // Track stats (unique)
  const uniqueTracks = new Set<string>();
  for (const playlist of data.playlists) {
    for (const track of playlist.tracks) {
      uniqueTracks.add(`${track.artist}|${track.song}`);
    }
  }
  const spotifyIndexedCount = Object.keys(data.spotifyIndex).length;

  // Tag stats
  const tagCounts = new Map<string, number>();
  for (const bio of Object.values(data.artistBios)) {
    for (const tag of bio.tags || []) {
      const normalizedTag = tag.toLowerCase();
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, artistCount]) => ({ tag, artistCount }));

  return {
    playlists: {
      total: data.playlists.length,
      dateRange: {
        earliest: sortedDates[0],
        latest: sortedDates[sortedDates.length - 1],
      },
      totalTracks,
      averageTracksPerPlaylist: Math.round(totalTracks / data.playlists.length),
    },
    artists: {
      total: data.allArtists.length,
      withBios: artistsWithBios,
      withImages: artistsWithImages,
    },
    tracks: {
      total: totalTracks,
      unique: uniqueTracks.size,
      spotifyIndexed: spotifyIndexedCount,
      spotifyCoverage: `${Math.round((spotifyIndexedCount / uniqueTracks.size) * 100)}%`,
    },
    tags: {
      total: tagCounts.size,
      topTags,
    },
  };
}

// 14. analyze_top_artists - Show most featured artists with dedicated shows
export function analyzeTopArtists(
  data: ArchiveData,
  params: {
    startYear?: number;
    endYear?: number;
    limit?: number;
  }
): {
  dateRange: { start: string; end: string };
  totalArtists: number;
  topArtists: TopArtist[];
} {
  const { startYear, endYear, limit = 25 } = params;

  // Filter playlists by year if specified
  let playlists = data.playlists;
  if (startYear) {
    playlists = playlists.filter((p) => parseInt(p.date.split('-')[0]) >= startYear);
  }
  if (endYear) {
    playlists = playlists.filter((p) => parseInt(p.date.split('-')[0]) <= endYear);
  }

  // Aggregate artist data
  const artistStats = new Map<
    string,
    {
      appearances: number;
      songs: Set<string>;
      playlists: Set<string>;
      firstDate: string;
      lastDate: string;
      dedicatedShows: { date: string; title: string }[];
    }
  >();

  for (const playlist of playlists) {
    const artistTrackCount = new Map<string, number>();
    const artistSongsInPlaylist = new Map<string, string[]>();

    for (const track of playlist.tracks) {
      artistTrackCount.set(track.artist, (artistTrackCount.get(track.artist) || 0) + 1);
      const songs = artistSongsInPlaylist.get(track.artist) || [];
      songs.push(track.song);
      artistSongsInPlaylist.set(track.artist, songs);
    }

    for (const [artist, count] of artistTrackCount) {
      let stats = artistStats.get(artist);
      if (!stats) {
        stats = {
          appearances: 0,
          songs: new Set(),
          playlists: new Set(),
          firstDate: playlist.date,
          lastDate: playlist.date,
          dedicatedShows: [],
        };
        artistStats.set(artist, stats);
      }

      stats.appearances += count;
      stats.playlists.add(playlist.date);
      for (const song of artistSongsInPlaylist.get(artist) || []) {
        stats.songs.add(song);
      }

      if (playlist.date < stats.firstDate) stats.firstDate = playlist.date;
      if (playlist.date > stats.lastDate) stats.lastDate = playlist.date;

      // Check if this is a dedicated show (artist in title or 80%+ of tracks)
      const titleLower = playlist.title.toLowerCase();
      const artistLower = artist.toLowerCase();
      const trackPercentage = count / playlist.tracks.length;

      if (titleLower.includes(artistLower) || trackPercentage >= 0.8) {
        // Avoid duplicates
        if (!stats.dedicatedShows.some((s) => s.date === playlist.date)) {
          stats.dedicatedShows.push({ date: playlist.date, title: playlist.title });
        }
      }
    }
  }

  // Sort by total appearances
  const sorted = [...artistStats.entries()].sort(
    (a, b) => b[1].appearances - a[1].appearances
  );

  const dateRange = {
    start: playlists.length > 0 ? playlists.map((p) => p.date).sort()[0] : '',
    end:
      playlists.length > 0
        ? playlists.map((p) => p.date).sort()[playlists.length - 1]
        : '',
  };

  return {
    dateRange,
    totalArtists: artistStats.size,
    topArtists: sorted.slice(0, limit).map(([artist, stats]) => {
      const bio = data.artistBios[artist];
      return {
        artist,
        totalAppearances: stats.appearances,
        uniqueSongs: stats.songs.size,
        playlistCount: stats.playlists.size,
        firstAppearance: stats.firstDate,
        lastAppearance: stats.lastDate,
        mostCommonTags: (bio?.tags || []).slice(0, 5),
        dedicatedShows: stats.dedicatedShows.sort((a, b) => a.date.localeCompare(b.date)),
      };
    }),
  };
}

// 15. analyze_genre_trends - Analyze genre evolution over time
export function analyzeGenreTrends(
  data: ArchiveData,
  params: {
    startYear?: number;
    endYear?: number;
  }
): {
  years: GenreTrend[];
} {
  const { startYear, endYear } = params;

  // Get unique years
  const yearSet = new Set<number>();
  for (const playlist of data.playlists) {
    const year = parseInt(playlist.date.split('-')[0]);
    if ((!startYear || year >= startYear) && (!endYear || year <= endYear)) {
      yearSet.add(year);
    }
  }

  const years = [...yearSet].sort();
  const yearlyTrends: GenreTrend[] = [];
  const previousYearTags = new Map<string, number>();

  for (const year of years) {
    const yearPlaylists = data.playlists.filter(
      (p) => parseInt(p.date.split('-')[0]) === year
    );

    // Count tags for this year
    const tagCounts = new Map<string, number>();
    let totalTracks = 0;

    for (const playlist of yearPlaylists) {
      for (const track of playlist.tracks) {
        totalTracks++;
        const bio = data.artistBios[track.artist];
        for (const tag of bio?.tags || []) {
          const normalizedTag = tag.toLowerCase();
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
        }
      }
    }

    // Calculate percentages
    const dominantGenres = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, trackCount]) => ({
        tag,
        trackCount,
        percentage: Math.round((trackCount / totalTracks) * 100 * 10) / 10,
      }));

    // Find rising and declining genres
    const risingGenres: string[] = [];
    const decliningGenres: string[] = [];

    if (previousYearTags.size > 0) {
      for (const [tag, count] of tagCounts) {
        const prevCount = previousYearTags.get(tag) || 0;
        if (prevCount > 0) {
          const change = (count - prevCount) / prevCount;
          if (change > 0.2) risingGenres.push(tag);
          if (change < -0.2) decliningGenres.push(tag);
        } else if (count > 5) {
          risingGenres.push(tag); // New genre with significant presence
        }
      }
    }

    yearlyTrends.push({
      year,
      playlistCount: yearPlaylists.length,
      dominantGenres,
      risingGenres: risingGenres.slice(0, 5),
      decliningGenres: decliningGenres.slice(0, 5),
    });

    // Store for next iteration
    previousYearTags.clear();
    for (const [tag, count] of tagCounts) {
      previousYearTags.set(tag, count);
    }
  }

  return { years: yearlyTrends };
}

// 16. analyze_themes - Identify thematic patterns in playlists
export function analyzeThemes(data: ArchiveData): {
  themes: ThemeAnalysis[];
} {
  const themes: ThemeAnalysis[] = [];

  // Artist Tributes - single artist shows
  const tributeShows: { date: string; title: string }[] = [];
  for (const playlist of data.playlists) {
    const artistCounts = new Map<string, number>();
    for (const track of playlist.tracks) {
      artistCounts.set(track.artist, (artistCounts.get(track.artist) || 0) + 1);
    }

    // Check if any artist has 80%+ of tracks
    for (const [artist, count] of artistCounts) {
      if (count / playlist.tracks.length >= 0.8) {
        tributeShows.push({ date: playlist.date, title: playlist.title });
        break;
      }
    }
  }

  if (tributeShows.length > 0) {
    themes.push({
      theme: 'Artist Tributes',
      description: 'Episodes dedicated to celebrating a single artist\'s catalog',
      playlistCount: tributeShows.length,
      examples: tributeShows.slice(0, 5),
    });
  }

  // Best Of / Year End
  const bestOfShows = data.playlists
    .filter((p) => {
      const titleLower = p.title.toLowerCase();
      return (
        titleLower.includes('best of') ||
        titleLower.includes('favorites') ||
        titleLower.includes('top music picks') ||
        titleLower.includes('year in review')
      );
    })
    .map((p) => ({ date: p.date, title: p.title }));

  if (bestOfShows.length > 0) {
    themes.push({
      theme: 'Year-End Best Of',
      description: 'Annual retrospectives of favorite music',
      playlistCount: bestOfShows.length,
      examples: bestOfShows.slice(0, 5),
    });
  }

  // Holiday / Christmas
  const holidayShows = data.playlists
    .filter((p) => {
      const titleLower = p.title.toLowerCase();
      return (
        titleLower.includes('christmas') ||
        titleLower.includes('holiday') ||
        titleLower.includes('seasonal')
      );
    })
    .map((p) => ({ date: p.date, title: p.title }));

  if (holidayShows.length > 0) {
    themes.push({
      theme: 'Holiday Specials',
      description: 'Christmas and seasonal music episodes',
      playlistCount: holidayShows.length,
      examples: holidayShows.slice(0, 5),
    });
  }

  // Memorial / Tribute (recently passed artists)
  const memorialShows = data.playlists
    .filter((p) => {
      const titleLower = p.title.toLowerCase();
      const descLower = (p.description || '').toLowerCase();
      return (
        titleLower.includes('memorial') ||
        titleLower.includes('tribute') ||
        titleLower.includes('remembering') ||
        descLower.includes('passed away') ||
        descLower.includes('who died')
      );
    })
    .map((p) => ({ date: p.date, title: p.title }));

  if (memorialShows.length > 0) {
    themes.push({
      theme: 'Memorial Tributes',
      description: 'Episodes honoring artists who recently passed away',
      playlistCount: memorialShows.length,
      examples: memorialShows.slice(0, 5),
    });
  }

  // Era-focused shows
  const eraShows = data.playlists
    .filter((p) => {
      const titleLower = p.title.toLowerCase();
      return (
        titleLower.includes('60s') ||
        titleLower.includes('70s') ||
        titleLower.includes('80s') ||
        titleLower.includes('classic') ||
        titleLower.includes('golden age')
      );
    })
    .map((p) => ({ date: p.date, title: p.title }));

  if (eraShows.length > 0) {
    themes.push({
      theme: 'Era Retrospectives',
      description: 'Episodes focused on specific musical eras',
      playlistCount: eraShows.length,
      examples: eraShows.slice(0, 5),
    });
  }

  return { themes };
}

// 17. get_curation_summary - Full curation analysis combining all insights
export function getCurationSummary(data: ArchiveData): {
  overview: string;
  dateRange: { start: string; end: string };
  totalPlaylists: number;
  totalTracks: number;
  totalArtists: number;
  topArtists: { artist: string; appearances: number; dedicatedShows: number }[];
  dominantGenres: { tag: string; percentage: number }[];
  themes: { theme: string; count: number }[];
  observations: string[];
} {
  const stats = getStatistics(data);
  const topArtistsData = analyzeTopArtists(data, { limit: 10 });
  const themesData = analyzeThemes(data);

  // Calculate genre percentages across all playlists
  const tagCounts = new Map<string, number>();
  let totalTracks = 0;

  for (const playlist of data.playlists) {
    for (const track of playlist.tracks) {
      totalTracks++;
      const bio = data.artistBios[track.artist];
      for (const tag of bio?.tags || []) {
        const normalizedTag = tag.toLowerCase();
        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
      }
    }
  }

  const dominantGenres = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({
      tag,
      percentage: Math.round((count / totalTracks) * 100 * 10) / 10,
    }));

  // Generate observations
  const observations: string[] = [];

  const topArtist = topArtistsData.topArtists[0];
  if (topArtist) {
    observations.push(
      `${topArtist.artist} is the most featured artist with ${topArtist.totalAppearances} track appearances across ${topArtist.playlistCount} shows.`
    );
    if (topArtist.dedicatedShows.length > 0) {
      observations.push(
        `${topArtist.artist} had ${topArtist.dedicatedShows.length} dedicated episode(s).`
      );
    }
  }

  if (dominantGenres.length > 0) {
    const topGenres = dominantGenres.slice(0, 3).map((g) => g.tag);
    observations.push(
      `The most common genres are ${topGenres.join(', ')}, reflecting a strong roots music focus.`
    );
  }

  const tributeTheme = themesData.themes.find((t) => t.theme === 'Artist Tributes');
  if (tributeTheme) {
    observations.push(
      `${tributeTheme.playlistCount} episodes were dedicated artist tributes, showcasing deep appreciation for individual artists.`
    );
  }

  // Build overview
  const overview = `Bill Shapiro's Cyprus Avenue archive spans ${stats.playlists.dateRange.earliest} to ${stats.playlists.dateRange.latest}, featuring ${stats.playlists.total} curated playlists with ${stats.tracks.unique} unique tracks from ${stats.artists.total} artists. The collection emphasizes roots music, classic soul, and singer-songwriters.`;

  return {
    overview,
    dateRange: {
      start: stats.playlists.dateRange.earliest,
      end: stats.playlists.dateRange.latest,
    },
    totalPlaylists: stats.playlists.total,
    totalTracks: stats.tracks.unique,
    totalArtists: stats.artists.total,
    topArtists: topArtistsData.topArtists.slice(0, 5).map((a) => ({
      artist: a.artist,
      appearances: a.totalAppearances,
      dedicatedShows: a.dedicatedShows.length,
    })),
    dominantGenres,
    themes: themesData.themes.map((t) => ({ theme: t.theme, count: t.playlistCount })),
    observations,
  };
}
