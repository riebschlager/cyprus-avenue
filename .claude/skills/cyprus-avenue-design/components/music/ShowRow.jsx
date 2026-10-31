import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { DateStamp } from '../core/Label.jsx';
const cx = (...a) => a.filter(Boolean).join(' ');

export function ShowRow({ date, title, description, trackCount, compact, onClick, href = '#' }) {
  return (
    <li style={{ listStyle: 'none' }}>
      <a className={cx('ca-showrow', compact && 'ca-showrow--compact')} href={href} onClick={e => { if (onClick) { e.preventDefault(); onClick(); } }}>
        <DateStamp date={date} className="ca-showrow__date" />
        <div style={{ minWidth: 0 }}>
          <div className="ca-showrow__title">{title}</div>
          {description && !compact && <p className="ca-showrow__desc">{description}</p>}
        </div>
        <span className="ca-showrow__count">{trackCount} track{trackCount === 1 ? '' : 's'}</span>
        <Icon name="arrow-right" className="ca-showrow__go" />
      </a>
    </li>
  );
}

export function ShowList({ children }) {
  return <ul className="ca-showlist">{children}</ul>;
}
