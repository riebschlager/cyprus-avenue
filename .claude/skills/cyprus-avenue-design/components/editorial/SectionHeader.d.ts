export interface SectionHeaderProps {
  title: React.ReactNode;
  /** Mono orange kicker before the title (e.g. "01", "On air"). */
  kicker?: string;
  /** Right-aligned element, usually <Button variant="link">. */
  action?: React.ReactNode;
  /** md = 4px ink rule, 28px title · sm = 2px rule, 18px title */
  size?: 'md' | 'sm';
  as?: 'h1' | 'h2' | 'h3';
}
/** Heavy-ruled section opener — the main hierarchy device of the system. */
export declare function SectionHeader(props: SectionHeaderProps): JSX.Element;

export interface StatProps { value: React.ReactNode; label: string; }
export declare function Stat(props: StatProps): JSX.Element;
export interface StatRowProps { children: React.ReactNode; }
/** Grid of Stats separated by hairlines under an ink rule. */
export declare function StatRow(props: StatRowProps): JSX.Element;

export interface PullQuoteProps { children: React.ReactNode; cite?: string; }
export declare function PullQuote(props: PullQuoteProps): JSX.Element;
