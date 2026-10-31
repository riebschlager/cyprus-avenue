import React from 'react';
import { Icon } from './Icon.jsx';
const cx = (...a) => a.filter(Boolean).join(' ');

export function Button({ variant = 'primary', size = 'md', icon, iconRight, block, href, children, className, ...rest }) {
  const cls = cx('ca-btn', 'ca-btn--' + variant, size !== 'md' && 'ca-btn--' + size, block && 'ca-btn--block', className);
  const inner = <>{icon && <Icon name={icon} />}{children}{iconRight && <Icon name={iconRight} />}</>;
  if (href) return <a className={cls} href={href} {...rest}>{inner}</a>;
  return <button type="button" className={cls} {...rest}>{inner}</button>;
}
