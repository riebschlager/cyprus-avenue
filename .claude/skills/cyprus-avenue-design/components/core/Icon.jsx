import React from 'react';

const LUCIDE = 'https://cdn.jsdelivr.net/npm/lucide-static@0.460.0/icons/';
const cache = {};
const load = name => cache[name] || (cache[name] = fetch(LUCIDE + name + '.svg').then(r => r.ok ? r.text() : '').then(t =>
  t.replace(/<!--[\s\S]*?-->/, '').replace(/width="24"/, 'width="100%"').replace(/height="24"/, 'height="100%"').replace(/class="[^"]*"/, '')
).catch(() => ''));

export function Icon({ name, size, className = '', style, label, onClick }) {
  const [svg, setSvg] = React.useState(typeof cache[name] === 'string' ? cache[name] : '');
  React.useEffect(() => { let on = true; load(name).then(s => { if (on) setSvg(s); }); return () => { on = false; }; }, [name]);
  return (
    <span
      className={'ca-icon ' + className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      onClick={onClick}
      style={{ ...(size ? { fontSize: size } : null), ...style }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
