export interface TagProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** Optional count shown in mono after the label. */
  count?: number;
  active?: boolean;
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
}
/** Genre/tag filter chip. Lowercase labels, as they come from Last.fm/Spotify. */
export declare function Tag(props: TagProps): JSX.Element;

export interface BadgeProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'ink' | 'success' | 'outline';
}
/** Small mono uppercase status marker ("New", "Not on Spotify", "12 tracks"). */
export declare function Badge(props: BadgeProps): JSX.Element;
