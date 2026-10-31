export interface IconProps {
  /** Lucide icon name, kebab-case (e.g. "play", "search", "external-link"). */
  name: string;
  /** Pixel size; defaults to 1em of the parent font-size. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Accessible label. Omit for decorative icons. */
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
}
export declare function Icon(props: IconProps): JSX.Element;
