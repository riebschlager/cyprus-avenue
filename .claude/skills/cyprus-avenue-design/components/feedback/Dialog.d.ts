export interface DialogProps {
  open?: boolean;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** Right-aligned buttons. */
  footer?: React.ReactNode;
  onClose?: () => void;
  /** Render without the fixed scrim (docs/cards). */
  inline?: boolean;
}
/** Modal for confirmations like "Create Spotify playlist". */
export declare function Dialog(props: DialogProps): JSX.Element | null;
