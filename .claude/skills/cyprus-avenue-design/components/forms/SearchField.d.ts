export interface SearchFieldProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** md = boxed 40px field · lg = 64px headline search with ink underline */
  size?: 'md' | 'lg';
  /** Keyboard hint shown when empty. */
  shortcut?: string | null;
  autoFocus?: boolean;
}
export declare function SearchField(props: SearchFieldProps): JSX.Element;
