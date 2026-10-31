export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Lucide icon name. */
  icon: string;
  /** Required accessible label; also shown as native title. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline';
  active?: boolean;
  /** Hidden until the parent .ca-track row is hovered/focused. */
  reveal?: boolean;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;

export interface PlayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  playing?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
/** Round orange play/pause — the only circular control in the system. */
export declare function PlayButton(props: PlayButtonProps): JSX.Element;
