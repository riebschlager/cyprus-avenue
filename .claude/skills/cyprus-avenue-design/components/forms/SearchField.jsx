import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { IconButton } from '../core/IconButton.jsx';
const cx = (...a) => a.filter(Boolean).join(' ');

export function SearchField({ value, onChange, placeholder = 'Search shows, artists, songs', size = 'md', shortcut = '/', autoFocus, className }) {
  return (
    <label className={cx('ca-search', size === 'lg' && 'ca-search--lg', className)}>
      <Icon name="search" />
      <input type="search" value={value} onChange={e => onChange && onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} aria-label={placeholder} />
      {value ? <IconButton icon="x" label="Clear search" size="sm" className="ca-search__clear" onClick={() => onChange && onChange('')} />
             : shortcut && size !== 'lg' && <kbd className="ca-search__kbd">{shortcut}</kbd>}
    </label>
  );
}
