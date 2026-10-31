export interface EqualizerProps {
  /** Animate bars. When false, bars freeze in place. */
  playing?: boolean;
  /** Bar color override; default label orange. */
  color?: string;
}
/** Four-bar now-playing indicator. Replaces the track number of the playing row. */
export declare function Equalizer(props: EqualizerProps): JSX.Element;
