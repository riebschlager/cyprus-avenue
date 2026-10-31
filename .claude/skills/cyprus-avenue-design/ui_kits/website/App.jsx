function parseHash() {
  const [page, ...rest] = decodeURIComponent(location.hash.slice(1) || 'home').split('/');
  return { page, arg: rest.join('/') };
}
function App() {
  const [route, setRoute] = React.useState(parseHash());
  const [np, setNp] = React.useState(null);       // { show, index, track, list, title }
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [toastMsg, setToastMsg] = React.useState(null);
  const [dialog, setDialog] = React.useState(null);
  const [menu, setMenu] = React.useState(false);
  React.useEffect(() => { const h = () => { setRoute(parseHash()); window.scrollTo(0, 0); setMenu(false); }; addEventListener('hashchange', h); return () => removeEventListener('hashchange', h); }, []);
  React.useEffect(() => { if (!playing) return; const t = setInterval(() => setProgress(p => p >= 1 ? 0 : p + 0.004), 200); return () => clearInterval(t); }, [playing]);
  React.useEffect(() => { if (!toastMsg) return; const t = setTimeout(() => setToastMsg(null), 2600); return () => clearTimeout(t); }, [toastMsg]);
  const go = (page, arg) => { location.hash = arg ? page + '/' + encodeURIComponent(arg) : page; };
  const play = (show, index) => {
    if (np && np.show === show.date && np.index === index) { setPlaying(p => !p); return; }
    let i = index; while (show.tracks[i] && show.tracks[i].unavailable) i++;
    if (!show.tracks[i]) return;
    setNp({ show: show.date, index: i, track: show.tracks[i], list: show.tracks, title: show.title, src: show }); setPlaying(true); setProgress(0);
  };
  const step = d => { if (!np) return; const s = np.src; let i = np.index + d; while (s.tracks[i] && s.tracks[i].unavailable) i += d; if (s.tracks[i]) { setNp({ ...np, index: i, track: s.tracks[i] }); setProgress(0); } };
  const toast = m => setToastMsg(m);
  const spotify = show => setDialog(show);
  const p = { go, play, nowPlaying: np, playing, toast, spotify };
  const { page, arg } = route;
  const current = page === 'show' ? 'shows' : page === 'artist' ? 'artists' : page;
  let body;
  if (page === 'shows') body = <CAK.Shows {...p} />;
  else if (page === 'show') body = <CAK.ShowDetail key={arg} date={arg} {...p} />;
  else if (page === 'artists') body = <CAK.Artists {...p} />;
  else if (page === 'artist') body = <CAK.ArtistDetail key={arg} name={arg} {...p} />;
  else if (page === 'search' || page === 'tracks') body = <CAK.Search {...p} initial={arg} />;
  else if (page === 'about') body = <CAK.About {...p} />;
  else body = <CAK.Home {...p} />;
  const avail = dialog ? dialog.tracks.filter(t => !t.unavailable).length : 0;
  return (
    <>
      <SiteHeader current={current} onNavigate={id => go(id === 'tracks' ? 'search' : id)} onSearch={() => go('search')} onMenu={() => setMenu(m => !m)} />
      {menu && (
        <nav className="kit-mobilemenu">
          {NAV.map(n => <a key={n.id} href="#" aria-current={current === n.id ? 'page' : undefined} onClick={e => { e.preventDefault(); go(n.id === 'tracks' ? 'search' : n.id); }}>{n.label}<Icon name="arrow-right" /></a>)}
        </nav>
      )}
      <main>{body}</main>
      <SiteFooter onNavigate={id => go(id === 'tracks' ? 'search' : id)} />
      <PlayerBar track={np && np.track} playing={playing} progress={progress} showTitle={np && np.title} onToggle={() => setPlaying(x => !x)} onPrev={() => step(-1)} onNext={() => step(1)} />
      {toastMsg && <div className="kit-toast"><Toast tone="success" onClose={() => setToastMsg(null)}>{toastMsg}</Toast></div>}
      <Dialog open={!!dialog} title="Add to Spotify" onClose={() => setDialog(null)}
        footer={<><Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button><Button variant="accent" icon="list-plus" onClick={() => { setDialog(null); toast('Playlist created · ' + avail + ' tracks'); }}>Create playlist</Button></>}>
        {dialog && <>Creates a private playlist named <em>Cyprus Avenue · {dialog.title}</em> in your Spotify library with {avail} of {dialog.tracks.length} tracks{avail < dialog.tracks.length ? '. The rest aren’t on Spotify.' : '.'}</>}
      </Dialog>
    </>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
