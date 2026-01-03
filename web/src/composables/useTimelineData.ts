import { computed, ref, type Ref } from 'vue';
import { usePlaylists } from './usePlaylists';
import { generatePlaylistSlug } from '../utils/slug';
import type { Playlist } from '../types/playlist';
import type { TimelineItem, EpisodeType, ArtistAppearance } from '../types/timeline';

function inferEpisodeType(title: string): EpisodeType {
  const lowerTitle = title.toLowerCase();

  // Check for memorial/tribute keywords
  if (lowerTitle.includes('memorial') ||
      lowerTitle.includes('remembering') ||
      lowerTitle.includes('tribute') ||
      lowerTitle.includes('warmly remembered')) {
    return 'tribute';
  }

  // Check for best-of/top picks
  if (lowerTitle.includes('best') ||
      lowerTitle.includes('top') ||
      lowerTitle.includes('favorite') ||
      lowerTitle.includes('picks of')) {
    return 'best-of';
  }

  // Check for themed collections
  if (lowerTitle.includes('vol.') ||
      lowerTitle.includes('ballads') ||
      lowerTitle.includes('redux') ||
      lowerTitle.includes('encore') ||
      lowerTitle.includes('rhythm')) {
    return 'themed';
  }

  // Single-artist episodes (typically have artist name prominently)
  // These often have formats like "Meet X", "Here Comes X", or just the artist name
  if (lowerTitle.includes('meet ') ||
      lowerTitle.includes('here comes') ||
      lowerTitle.includes(' is back')) {
    return 'single-artist';
  }

  return 'single-artist'; // Default for most episodes
}

function getTypeColor(type: EpisodeType): string {
  const colors: Record<EpisodeType, string> = {
    'tribute': '#ef4444',      // red - memorials
    'best-of': '#8b5cf6',      // purple - best-of lists
    'single-artist': '#3b82f6', // blue - artist spotlights
    'themed': '#10b981',        // green - themed collections
    'regular': '#6b7280'        // gray - regular episodes
  };
  return colors[type];
}

function getTypeLabel(type: EpisodeType): string {
  const labels: Record<EpisodeType, string> = {
    'tribute': 'Memorial/Tribute',
    'best-of': 'Best Of',
    'single-artist': 'Artist Spotlight',
    'themed': 'Themed Collection',
    'regular': 'Regular Episode'
  };
  return labels[type];
}

export function useTimelineData(filterTypes?: Ref<Set<EpisodeType>>, searchArtist?: Ref<string>) {
  const { playlists, isLoading } = usePlaylists();

  // Convert playlists to timeline items
  const allTimelineItems = computed<TimelineItem[]>(() => {
    return playlists.value.map(playlist => {
      const type = inferEpisodeType(playlist.title);
      const slug = generatePlaylistSlug(playlist.title, playlist.date);

      return {
        id: slug,
        content: playlist.title,
        start: new Date(playlist.date),
        title: playlist.title,
        type,
        trackCount: playlist.tracks.length,
        slug,
        className: `episode-${type}`
      };
    });
  });

  // Filter timeline items based on type filters and artist search
  const filteredTimelineItems = computed<TimelineItem[]>(() => {
    let items = allTimelineItems.value;

    // Filter by episode types
    if (filterTypes?.value && filterTypes.value.size > 0) {
      items = items.filter(item => filterTypes.value.has(item.type));
    }

    // Filter by artist search
    if (searchArtist?.value && searchArtist.value.trim()) {
      const searchTerm = searchArtist.value.toLowerCase();
      items = items.filter(item => {
        const playlist = playlists.value.find(p => generatePlaylistSlug(p.title, p.date) === item.id);
        if (!playlist) return false;

        // Check if any track artist matches search
        return playlist.tracks.some(track =>
          track.artist.toLowerCase().includes(searchTerm)
        );
      });
    }

    return items;
  });

  // Get top artists with their appearance dates
  const topArtists = computed<ArtistAppearance[]>(() => {
    const artistMap = new Map<string, Date[]>();

    playlists.value.forEach(playlist => {
      const date = new Date(playlist.date);
      playlist.tracks.forEach(track => {
        const existing = artistMap.get(track.artist) || [];
        existing.push(date);
        artistMap.set(track.artist, existing);
      });
    });

    const appearances: ArtistAppearance[] = Array.from(artistMap.entries())
      .map(([artist, dates]) => ({
        artist,
        count: dates.length,
        dates: dates.sort((a, b) => a.getTime() - b.getTime())
      }))
      .sort((a, b) => b.count - a.count);

    return appearances.slice(0, 10); // Top 10 artists
  });

  // Get artist timeline items for swimlanes
  const artistTimelineItems = computed<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    topArtists.value.slice(0, 5).forEach(appearance => {
      appearance.dates.forEach((date, index) => {
        items.push({
          id: `${appearance.artist}-${index}`,
          content: '●',
          start: date,
          title: appearance.artist,
          type: 'single-artist',
          trackCount: 1,
          slug: '',
          group: appearance.artist,
          className: 'artist-appearance'
        });
      });
    });

    return items;
  });

  // Statistics
  const stats = computed(() => {
    const items = allTimelineItems.value;
    const typeCount = new Map<EpisodeType, number>();

    items.forEach(item => {
      typeCount.set(item.type, (typeCount.get(item.type) || 0) + 1);
    });

    return {
      total: items.length,
      byType: Object.fromEntries(typeCount),
      dateRange: {
        start: items.length > 0 ? new Date(Math.min(...items.map(i => i.start.getTime()))) : null,
        end: items.length > 0 ? new Date(Math.max(...items.map(i => i.start.getTime()))) : null
      }
    };
  });

  return {
    allTimelineItems,
    filteredTimelineItems,
    topArtists,
    artistTimelineItems,
    stats,
    isLoading,
    getTypeColor,
    getTypeLabel
  };
}
