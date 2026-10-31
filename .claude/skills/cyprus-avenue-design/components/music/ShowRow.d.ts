/**
 * @startingPoint section="Music" subtitle="Archive list row: date, title, description, track count" viewport="700x320"
 */
export interface ShowRowProps {
  /** ISO "YYYY-MM-DD" */
  date: string;
  title: string;
  description?: string;
  trackCount: number;
  /** Tighter row without description or count (sidebars, history lists). */
  compact?: boolean;
  onClick?: () => void;
  href?: string;
}
export declare function ShowRow(props: ShowRowProps): JSX.Element;

export interface ShowListProps { children: React.ReactNode; }
/** Wrapper that adds the 2px ink top rule. */
export declare function ShowList(props: ShowListProps): JSX.Element;
