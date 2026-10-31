export interface PlayerTrack { song: string; artist: string; art?: string; }

/**
 * @startingPoint section="Music" subtitle="Fixed bottom player bar (ink), progress hairline, play/skip" viewport="700x120"
 */
export interface PlayerBarProps {
  track?: PlayerTrack | null;
  playing?: boolean;
  /** 0–1 */
  progress?: number;
  /** When false, shows "Connect Spotify" in place of the source line. */
  connected?: boolean;
  /** Render in flow instead of fixed to viewport bottom (for docs/cards). */
  staticPos?: boolean;
  /** Show the track came from. */
  showTitle?: string;
  onToggle?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onConnect?: () => void;
}
export declare function PlayerBar(props: PlayerBarProps): JSX.Element;
