export interface LabelProps {
  children: React.ReactNode;
  /** muted (default) · accent (orange-700) · ink */
  tone?: 'muted' | 'accent' | 'ink';
  size?: 'sm' | 'md';
  as?: keyof JSX.IntrinsicElements;
}
/** Mono uppercase eyebrow/kicker. Use above headlines and for metadata. */
export declare function Label(props: LabelProps): JSX.Element;

export interface DateStampProps {
  /** ISO date, "YYYY-MM-DD". */
  date: string;
  /** inline: "03 JAN 2015" · block: big day number over month/year */
  variant?: 'inline' | 'block';
  /** Prefix the weekday (shows aired Saturdays). */
  weekday?: boolean;
}
/** Broadcast date in the archive's house format. */
export declare function DateStamp(props: DateStampProps): JSX.Element;
