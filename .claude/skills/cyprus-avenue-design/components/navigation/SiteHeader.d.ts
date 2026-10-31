export interface NavItem { id: string; label: string; }

/**
 * @startingPoint section="Navigation" subtitle="Sticky masthead with wordmark, nav and search" viewport="1200x80"
 */
export interface SiteHeaderProps {
  /** id of the active nav item ("home" | "shows" | "artists" | "tracks" | "about" | "search"). */
  current?: string;
  onNavigate?: (id: string) => void;
  onSearch?: () => void;
  /** Mobile hamburger. */
  onMenu?: () => void;
  items?: NavItem[];
}
export declare function SiteHeader(props: SiteHeaderProps): JSX.Element;

export interface WordmarkProps { onClick?: () => void; sub?: string; }
/** Typeset wordmark — there is no logo file. */
export declare function Wordmark(props: WordmarkProps): JSX.Element;

export interface SiteFooterProps { onNavigate?: (id: string) => void; }
export declare function SiteFooter(props: SiteFooterProps): JSX.Element;
export declare const NAV: NavItem[];
