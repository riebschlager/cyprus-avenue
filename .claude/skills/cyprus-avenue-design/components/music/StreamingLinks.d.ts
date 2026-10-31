export interface StreamingLinksProps {
  artist: string;
  song: string;
  /** Called with "spotify" | "apple" | "youtube". */
  onPick?: (service: string) => void;
  /** Hide trigger until the row is hovered. */
  reveal?: boolean;
}
/** Icon trigger + dropdown linking a track out to streaming services. */
export declare function StreamingLinks(props: StreamingLinksProps): JSX.Element;

export interface StreamingMenuProps {
  artist?: string;
  song?: string;
  onPick?: (service: string) => void;
  style?: React.CSSProperties;
}
/** The open menu on its own, for static layouts. */
export declare function StreamingMenu(props: StreamingMenuProps): JSX.Element;
