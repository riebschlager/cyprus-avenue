/**
 * @startingPoint section="Core" subtitle="Primary, accent, secondary, ghost and link buttons" viewport="700x260"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = ink fill · accent = label orange · secondary = ink outline · ghost · link */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  /** Lucide icon before the label. */
  icon?: string;
  /** Lucide icon after the label (e.g. "arrow-right"). */
  iconRight?: string;
  block?: boolean;
  /** Render as <a>. */
  href?: string;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
