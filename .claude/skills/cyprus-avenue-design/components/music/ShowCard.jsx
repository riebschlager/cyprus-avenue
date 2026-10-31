import React from 'react';
import { Label, DateStamp } from '../core/Label.jsx';
const cx = (...a) => a.filter(Boolean).join(' ');

export function ShowCard({ date, title, description, trackCount, artists, eyebrow, variant = 'default', onClick, href = '#', children }) {
  return (
    <a className={cx('ca-showcard', variant === 'feature' && 'ca-showcard--feature')} href={href} onClick={e => { if (onClick) { e.preventDefault(); onClick(); } }}>
      <div className="ca-showcard__top">
        {eyebrow ? <Label tone={variant === 'feature' ? 'ink' : 'accent'}>{eyebrow}</Label> : <DateStamp date={date} />}
        {eyebrow ? <DateStamp date={date} /> : trackCount != null && <Label size="sm">{trackCount} track{trackCount === 1 ? '' : 's'}</Label>}
      </div>
      <div className="ca-showcard__title">{title}</div>
      {description && <p className="ca-showcard__desc">{description}</p>}
      {artists && artists.length > 0 && <div className="ca-showcard__artists">{artists.slice(0, 4).join(' · ')}{artists.length > 4 ? ' + ' + (artists.length - 4) + ' more' : ''}</div>}
      {children}
    </a>
  );
}
