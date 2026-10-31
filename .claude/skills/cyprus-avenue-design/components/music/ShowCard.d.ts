/**
 * @startingPoint section="Music" subtitle="Editorial show card; feature variant is the orange label block" viewport="700x420"
 */
export interface ShowCardProps {
  date: string;
  title: string;
  description?: string;
  trackCount?: number;
  /** Featured artists, joined with middots (max 4 shown). */
  artists?: string[];
  /** Kicker text replacing the date in the top-left (date moves right). */
  eyebrow?: string;
  /** default = ink-ruled card · feature = full orange block, ink text */
  variant?: 'default' | 'feature';
  onClick?: () => void;
  href?: string;
  children?: React.ReactNode;
}
export declare function ShowCard(props: ShowCardProps): JSX.Element;
