/* Dev loader for cards & UI kits: loads React + Babel, compiles every component .jsx
   in dependency order into window.CA, then runs <script type="text/ca-jsx"> blocks
   with all components in scope. Not shipped to consumers (the compiled bundle replaces it). */
(function () {
  const me = document.currentScript.src;
  const root = new URL('..', me).href;
  const FILES = [
    'core/Icon', 'core/Label', 'core/IconButton', 'core/Button', 'core/Tag',
    'forms/SearchField', 'forms/Select',
    'music/Equalizer', 'music/StreamingLinks', 'music/TrackRow', 'music/ShowRow', 'music/ShowCard', 'music/ArtistRow', 'music/PlayerBar',
    'editorial/SectionHeader', 'navigation/SiteHeader', 'navigation/Tabs',
    'feedback/Dialog', 'feedback/Toast',
  ];
  const libs = [
    'https://unpkg.com/react@18.3.1/umd/react.development.js',
    'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
    'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
  ];
  const load = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  const compile = (src, ns) => {
    const names = [...src.matchAll(/export\s+(?:function|const)\s+(\w+)/g)].map(m => m[1]);
    let code = src
      .replace(/^import\s+React.*$/mg, '')
      .replace(/^import\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"];?/mg, 'const {$1} = __ns;')
      .replace(/export\s+(function|const)/g, '$1');
    code = Babel.transform(code, { presets: ['react'] }).code;
    new Function('React', '__ns', code + '\nObject.assign(__ns, {' + names.join(',') + '});')(React, ns);
  };
  window.CA = {};
  window.CA_READY = (async () => {
    for (const l of libs) await load(l);
    const srcs = await Promise.all(FILES.map(f => fetch(root + 'components/' + f + '.jsx').then(r => r.text())));
    srcs.forEach(s => compile(s, window.CA));
    for (const el of document.querySelectorAll('script[type="text/ca-jsx"]')) {
      const extra = el.src ? await fetch(el.src).then(r => r.text()) : el.textContent;
      const names = Object.keys(window.CA);
      const code = Babel.transform(extra, { presets: ['react'] }).code;
      new Function('React', 'ReactDOM', ...names, code)(React, ReactDOM, ...names.map(n => window.CA[n]));
    }
    return window.CA;
  })();
})();
