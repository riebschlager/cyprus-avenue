import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
import { Label } from '../core/Label.jsx';

const SERVICES = [
  { id: 'spotify', label: 'Spotify', color: 'var(--brand-spotify)' },
  { id: 'apple', label: 'Apple Music', color: 'var(--brand-apple)' },
  { id: 'youtube', label: 'YouTube Music', color: 'var(--brand-youtube)' },
];

export function StreamingMenu({ artist, song, onPick, style }) {
  return (
    <div className="ca-menu" role="menu" style={style}>
      <div className="ca-menu__label"><Label size="sm">Listen on</Label></div>
      {SERVICES.map(s => (
        <button key={s.id} className="ca-menu__item" role="menuitem" onClick={() => onPick && onPick(s.id)}>
          <span className="ca-stream__dot" style={{ background: s.color }} />{s.label}
          <span className="ca-menu__hint">↗</span>
        </button>
      ))}
    </div>
  );
}

export function StreamingLinks({ artist, song, onPick, reveal }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <span className="ca-stream" ref={ref}>
      <IconButton icon="audio-lines" label="Listen elsewhere" size="sm" reveal={reveal && !open} active={open} onClick={() => setOpen(o => !o)} />
      {open && <StreamingMenu artist={artist} song={song} style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)' }} onPick={id => { setOpen(false); onPick && onPick(id); }} />}
    </span>
  );
}
