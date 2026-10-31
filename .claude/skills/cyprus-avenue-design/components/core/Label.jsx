import React from 'react';
const cx = (...a) => a.filter(Boolean).join(' ');

export function Label({ children, tone = 'muted', size = 'md', as: As = 'span', className, ...rest }) {
  return <As className={cx('ca-label', tone !== 'muted' && 'ca-label--' + tone, size === 'sm' && 'ca-label--sm', className)} {...rest}>{children}</As>;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function DateStamp({ date, variant = 'inline', weekday, className }) {
  const [y, m, d] = String(date).split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dd = String(d).padStart(2, '0');
  if (variant === 'block') {
    return (
      <time dateTime={date} className={cx('ca-date ca-date--block', className)}>
        <span className="ca-date__day">{dd}</span>
        <span className="ca-date__rest">{MONTHS[m - 1]} {y}{weekday ? ' · ' + DAYS[dt.getDay()] : ''}</span>
      </time>
    );
  }
  return <time dateTime={date} className={cx('ca-date', className)}>{weekday ? DAYS[dt.getDay()] + ' ' : ''}{dd} {MONTHS[m - 1]} {y}</time>;
}
