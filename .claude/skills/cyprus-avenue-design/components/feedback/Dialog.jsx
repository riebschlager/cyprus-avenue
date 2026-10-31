import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

export function Dialog({ open = true, title, children, footer, onClose, inline }) {
  if (!open) return null;
  const box = (
    <div className="ca-dialog" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} onClick={e => e.stopPropagation()}>
      <div className="ca-dialog__head">
        <h2 className="ca-dialog__title">{title}</h2>
        <IconButton icon="x" label="Close" onClick={onClose} />
      </div>
      <div className="ca-dialog__body">{children}</div>
      {footer && <div className="ca-dialog__foot">{footer}</div>}
    </div>
  );
  if (inline) return box;
  return <div className="ca-scrim" onClick={onClose}>{box}</div>;
}
