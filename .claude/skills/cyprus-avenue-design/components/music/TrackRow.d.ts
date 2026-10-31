export interface Track {
  song: string;
  artist: string;
  /** Wide layout: show title column. */
  show?: string;
  /** Wide layout: extra column (e.g. air date). */
  meta?: string;
  unavailable?: boolean;
}

export interface TrackRowProps extends Track {
  index: number;
  playing?: boolean;
  paused?: boolean;
  /** Deep-linked track — orange-tinted background. */
  highlight?: boolean;
  onPlay?: () => void;
  onArtist?: (artist: string) => void;
  onCopyLink?: () => void;
}
export declare function TrackRow(props: TrackRowProps): JSX.Element;

/**
 * @startingPoint section="Music" subtitle="Numbered track list with play, copy link and streaming menu" viewport="700x360"
 */
export interface TrackListProps {
  tracks: Track[];
  /** Table layout with Song / Artist / Show / Aired columns. */
  wide?: boolean;
  /** Column headings for wide layout (after "#"). */
  columns?: string[];
  playingIndex?: number | null;
  paused?: boolean;
  highlightIndex?: number | null;
  onPlay?: (index: number, track: Track) => void;
  onArtist?: (artist: string) => void;
  onCopyLink?: (index: number, track: Track) => void;
}
export declare function TrackList(props: TrackListProps): JSX.Element;
