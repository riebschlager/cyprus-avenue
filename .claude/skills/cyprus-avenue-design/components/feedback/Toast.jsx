import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { IconButton } from '../core/IconButton.jsx';

const ICONS = { info: 'info', success: 'check', error: 'circle-alert' };

export function Toast({ tone = 'info', children, action, onAction, onClose }) {
  return (
    <div className={'ca-toast ca-toast--' + tone} role="status">
      <Icon name={ICONS[tone]} />
      <span className="ca-toast__msg">{children}</span>
      {action && <button className="ca-toast__action" onClick={onAction}>{action}</button>}
      {onClose && <IconButton icon="x" label="Dismiss" size="sm" onClick={onClose} />}
    </div>
  );
}

export function Tooltip({ text, children, open }) {
  return <span className={'ca-tip' + (open ? ' ca-tip--open' : '')}>{children}<span className="ca-tip__bubble" role="tooltip">{text}</span></span>;
}

export function Menu({ items, label, style }) {
  return (
    <div className="ca-menu" role="menu" style={style}>
      {label && <div className="ca-menu__label"><span className="ca-label ca-label--sm">{label}</span></div>}
      {items.map((it, i) => it === '-' ? <div key={i} className="ca-menu__sep" /> : (
        <button key={i} className="ca-menu__item" role="menuitem" onClick={it.onClick}>
          {it.icon && <Icon name={it.icon} />}{it.label}{it.hint && <span className="ca-menu__hint">{it.hint}</span>}
        </button>
      ))}
    </div>
  );
}
