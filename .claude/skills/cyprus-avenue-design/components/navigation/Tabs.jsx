import React from 'react';

export function Tabs({ value, onChange, items }) {
  return (
    <div className="ca-tabs" role="tablist">
      {items.map(t => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange && onChange(t.value)}>
          {t.label}{t.count != null && <span className="ca-tabs__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

const LETTERS = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function AlphaIndex({ value, onChange, available }) {
  return (
    <div className="ca-alpha" role="group" aria-label="Jump to letter">
      {LETTERS.map(l => (
        <button key={l} aria-pressed={value === l} disabled={available && !available.includes(l)} onClick={() => onChange && onChange(value === l ? null : l)}>{l}</button>
      ))}
    </div>
  );
}
