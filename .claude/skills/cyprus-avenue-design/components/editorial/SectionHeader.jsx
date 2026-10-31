import React from 'react';
import { Label } from '../core/Label.jsx';
const cx = (...a) => a.filter(Boolean).join(' ');

export function SectionHeader({ title, kicker, action, size = 'md', as: As = 'h2' }) {
  return (
    <div className={cx('ca-sechead', size === 'sm' && 'ca-sechead--sm')}>
      <div className="ca-sechead__left">
        {kicker && <Label tone="accent">{kicker}</Label>}
        <As className="ca-sechead__title">{title}</As>
      </div>
      {action}
    </div>
  );
}

export function Stat({ value, label }) {
  return <div className="ca-stat"><span className="ca-stat__value">{value}</span><Label>{label}</Label></div>;
}

export function StatRow({ children }) { return <div className="ca-stats">{children}</div>; }

export function PullQuote({ children, cite }) {
  return (
    <figure className="ca-quote">
      <span className="ca-quote__mark" aria-hidden="true">“</span>
      <blockquote className="ca-quote__text" style={{ margin: 0 }}>{children}</blockquote>
      {cite && <figcaption><Label>{cite}</Label></figcaption>}
    </figure>
  );
}
