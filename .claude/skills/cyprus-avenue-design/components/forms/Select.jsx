import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Label } from '../core/Label.jsx';
const cx = (...a) => a.filter(Boolean).join(' ');

export function Select({ value, onChange, options, label, size = 'md', className }) {
  const sel = (
    <span className={cx('ca-select', size === 'sm' && 'ca-select--sm', !label && className)}>
      <select value={value} onChange={e => onChange && onChange(e.target.value)} aria-label={label}>
        {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icon name="chevron-down" />
    </span>
  );
  if (!label) return sel;
  return <label className={cx('ca-field', className)}><Label size="sm">{label}</Label>{sel}</label>;
}

export function SegmentedControl({ value, onChange, options, label }) {
  return (
    <div className="ca-seg" role="group" aria-label={label}>
      {options.map(o => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        return (
          <button key={opt.value} type="button" aria-pressed={value === opt.value} onClick={() => onChange && onChange(opt.value)} aria-label={opt.icon && !opt.label ? opt.value : undefined}>
            {opt.icon && <Icon name={opt.icon} />}{opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Checkbox({ checked, onChange, children }) {
  return (
    <label className="ca-check">
      <input type="checkbox" checked={checked} onChange={e => onChange && onChange(e.target.checked)} />
      {children}
    </label>
  );
}
