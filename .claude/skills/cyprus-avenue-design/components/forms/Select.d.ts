type Opt = string | { value: string; label?: string; icon?: string };

export interface SelectProps {
  value: string;
  onChange?: (value: string) => void;
  options: Opt[];
  /** Mono label rendered above the field. */
  label?: string;
  size?: 'sm' | 'md';
}
/** Native select styled to the system (sort order, year filter). */
export declare function Select(props: SelectProps): JSX.Element;

export interface SegmentedControlProps {
  value: string;
  onChange?: (value: string) => void;
  options: Opt[];
  label?: string;
}
/** 2–4 mutually exclusive view toggles (List / Grid, Newest / Oldest). */
export declare function SegmentedControl(props: SegmentedControlProps): JSX.Element;

export interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  children?: React.ReactNode;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
