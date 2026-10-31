export interface TabItem { value: string; label: string; count?: number; }
export interface TabsProps {
  value: string;
  onChange?: (value: string) => void;
  items: TabItem[];
}
/** Underline tabs with optional mono counts (search result groups, artist page sections). */
export declare function Tabs(props: TabsProps): JSX.Element;

export interface AlphaIndexProps {
  /** Selected letter or null for all. */
  value: string | null;
  onChange?: (letter: string | null) => void;
  /** Letters that have entries; others are disabled. */
  available?: string[];
}
/** # A–Z jump bar for the artist index. */
export declare function AlphaIndex(props: AlphaIndexProps): JSX.Element;
