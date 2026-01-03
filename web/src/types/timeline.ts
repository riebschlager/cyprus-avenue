export type EpisodeType = 'tribute' | 'best-of' | 'single-artist' | 'themed' | 'regular';

export interface TimelineItem {
  id: string;
  content: string;
  start: Date;
  title: string;
  type: EpisodeType;
  trackCount: number;
  slug: string;
  group?: string;
  className?: string;
}

export interface ArtistAppearance {
  artist: string;
  count: number;
  dates: Date[];
}

export interface TimelineFilters {
  types: Set<EpisodeType>;
  searchArtist: string;
}
