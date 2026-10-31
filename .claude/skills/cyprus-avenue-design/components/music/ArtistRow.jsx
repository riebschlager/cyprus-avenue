import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Tag } from '../core/Tag.jsx';

export function ArtistRow({ name, songs, shows, tags = [], onClick, onTag, href = '#' }) {
  return (
    <a className="ca-artistrow" href={href} onClick={e => { if (onClick) { e.preventDefault(); onClick(); } }}>
      <span className="ca-artistrow__name">{name}</span>
      <span className="ca-artistrow__tags">
        {tags.slice(0, 3).map(t => <Tag key={t} size="sm" onClick={e => { e.preventDefault(); e.stopPropagation(); onTag && onTag(t); }}>{t}</Tag>)}
      </span>
      <span className="ca-artistrow__stat">{songs} song{songs === 1 ? '' : 's'} · {shows} show{shows === 1 ? '' : 's'}</span>
      <Icon name="arrow-right" className="ca-artistrow__go" />
    </a>
  );
}
