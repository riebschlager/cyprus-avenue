import React from 'react';
import { Icon } from './Icon.jsx';
const cx = (...a) => a.filter(Boolean).join(' ');

export function IconButton({ icon, label, size = 'md', variant = 'ghost', active, reveal, className, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx('ca-iconbtn', size !== 'md' && 'ca-iconbtn--' + size, variant === 'outline' && 'ca-iconbtn--outline', active && 'ca-iconbtn--active', reveal && 'ca-reveal', className)}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}

export function PlayButton({ playing, size = 'md', className, ...rest }) {
  return (
    <button type="button" aria-label={playing ? 'Pause' : 'Play'} className={cx('ca-play', size !== 'md' && 'ca-play--' + size, className)} {...rest}>
      <Icon name={playing ? 'pause' : 'play'} style={playing ? null : { marginLeft: 2 }} />
    </button>
  );
}
