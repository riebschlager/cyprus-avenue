export interface ToastProps {
  tone?: 'info' | 'success' | 'error';
  children: React.ReactNode;
  /** Action label, e.g. "Open in Spotify". */
  action?: string;
  onAction?: () => void;
  onClose?: () => void;
}
/** Ink notification, bottom-center above the player bar. */
export declare function Toast(props: ToastProps): JSX.Element;

export interface TooltipProps { text: string; children: React.ReactNode; open?: boolean; }
export declare function Tooltip(props: TooltipProps): JSX.Element;

export interface MenuItem { label: string; icon?: string; hint?: string; onClick?: () => void; }
export interface MenuProps {
  /** Items; "-" renders a separator. */
  items: (MenuItem | '-')[];
  label?: string;
  style?: React.CSSProperties;
}
/** Dropdown surface (download formats, share). */
export declare function Menu(props: MenuProps): JSX.Element;
