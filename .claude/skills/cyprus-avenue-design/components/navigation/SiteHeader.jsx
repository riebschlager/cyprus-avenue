import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

export const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'shows', label: 'Shows' },
  { id: 'artists', label: 'Artists' },
  { id: 'tracks', label: 'Tracks' },
  { id: 'about', label: 'About' },
];

export function Wordmark({ onClick, sub = 'KCUR 89.3 · 1978–2018' }) {
  return (
    <a className="ca-wordmark" href="#" onClick={e => { e.preventDefault(); onClick && onClick(); }}>
      <span className="ca-wordmark__name">Cyprus Avenue</span>
      <span className="ca-wordmark__sub">{sub}</span>
    </a>
  );
}

export function SiteHeader({ current = 'home', onNavigate, onSearch, onMenu, items = NAV }) {
  const go = id => e => { e.preventDefault(); onNavigate && onNavigate(id); };
  return (
    <header className="ca-header">
      <div className="ca-header__inner">
        <Wordmark onClick={() => onNavigate && onNavigate('home')} />
        <nav className="ca-nav" aria-label="Primary">
          {items.map(i => <a key={i.id} href="#" aria-current={current === i.id ? 'page' : undefined} onClick={go(i.id)}>{i.label}</a>)}
        </nav>
        <div className="ca-header__actions" style={{ marginLeft: 'auto' }}>
          <IconButton icon="search" label="Search" onClick={onSearch} active={current === 'search'} />
          <IconButton icon="menu" label="Menu" className="ca-header__burger" onClick={onMenu} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ onNavigate }) {
  const go = id => e => { e.preventDefault(); onNavigate && onNavigate(id); };
  return (
    <footer className="ca-footer">
      <div className="ca-footer__inner">
        <div className="ca-footer__mark">Cyprus<br />Avenue</div>
        <div className="ca-footer__col">
          <span className="ca-label ca-label--sm">Archive</span>
          <a href="#" onClick={go('shows')}>Shows</a><a href="#" onClick={go('artists')}>Artists</a><a href="#" onClick={go('tracks')}>Tracks</a><a href="#" onClick={go('about')}>About</a>
        </div>
        <div className="ca-footer__col">
          <span className="ca-label ca-label--sm">Elsewhere</span>
          <a href="https://www.kcur.org/tags/cyprus-avenue">KCUR</a>
          <a href="https://finding-aids.library.umkc.edu/repositories/2/resources/415/collection_organization">Marr Sound Archive</a>
          <a href="https://github.com/riebschlager/cyprus-avenue/">GitHub</a>
        </div>
        <div className="ca-footer__fine">
          <span className="ca-label ca-label--sm">Playlists © KCUR Kansas City Public Radio</span>
          <span className="ca-label ca-label--sm">Archive by Chris Riebschlager</span>
        </div>
      </div>
    </footer>
  );
}
