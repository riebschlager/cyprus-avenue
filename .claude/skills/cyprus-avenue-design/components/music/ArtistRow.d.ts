/**
 * @startingPoint section="Music" subtitle="Artist index row with tags and play counts" viewport="700x240"
 */
export interface ArtistRowProps {
  name: string;
  /** Unique songs played. */
  songs: number;
  /** Number of shows the artist appears in. */
  shows: number;
  /** Up to 3 genre tags shown (lowercase). */
  tags?: string[];
  onClick?: () => void;
  onTag?: (tag: string) => void;
  href?: string;
}
export declare function ArtistRow(props: ArtistRowProps): JSX.Element;
