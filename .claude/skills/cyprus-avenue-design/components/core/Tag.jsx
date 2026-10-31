import React from 'react';
import { Icon } from './Icon.jsx';
const cx = (...a) => a.filter(Boolean).join(' ');

export function Tag({ children, count, active, size = 'md', removable, onRemove, className, ...rest }) {
  return (
    <button type="button" className={cx('ca-tag', active && 'ca-tag--active', size === 'sm' && 'ca-tag--sm', className)} aria-pressed={active || undefined} {...rest}>
      {children}
      {count != null && <span className="ca-tag__count">{count}</span>}
      {removable && <Icon name="x" onClick={onRemove} />}
    </button>
  );
}

export function Badge({ children, tone = 'neutral', className }) {
  return <span className={cx('ca-badge', tone !== 'neutral' && 'ca-badge--' + tone, className)}>{children}</span>;
}
