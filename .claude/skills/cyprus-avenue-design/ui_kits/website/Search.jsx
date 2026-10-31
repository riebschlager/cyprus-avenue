window.CAK = window.CAK || {};
CAK.Search = function Search({ go, play, nowPlaying, playing, toast, initial = '' }) {
  const { shows, artists } = window.CA_DATA;
  const [q, setQ] = React.useState(initial);
  const [tab, setTab] = React.useState('all');
  const ql = q.trim().toLowerCase();
  const tracks = []; shows.forEach(s => s.tracks.forEach((t, i) => { if (ql && (t.song + ' ' + t.artist).toLowerCase().includes(ql)) tracks.push({ ...t, show: s.title, meta: s.date, _s: s, _i: i }); }));
  const sh = ql ? shows.filter(s => (s.title + ' ' + s.description).toLowerCase().includes(ql)) : [];
  const ar = ql ? artists.filter(a => a.name.toLowerCase().includes(ql)) : [];
  const items = [{ value: 'all', label: 'All', count: tracks.length + sh.length + ar.length }, { value: 'tracks', label: 'Tracks', count: tracks.length }, { value: 'shows', label: 'Shows', count: sh.length }, { value: 'artists', label: 'Artists', count: ar.length }];
  const pIdx = nowPlaying ? tracks.findIndex(t => t._s.date === nowPlaying.show && t._i === nowPlaying.index) : -1;
  return (
    <div className="kit-page" style={{ paddingTop: 48 }}>
      <SearchField size="lg" value={q} onChange={setQ} placeholder="Search 1,506 tracks, 277 artists, 125 shows" autoFocus />
      {!ql && (
        <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Label>Try</Label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{['Rosanne Cash','Christmas','Dancing In The Dark','gospel','Willie Nelson'].map(s => <Tag key={s} onClick={() => setQ(s)}>{s}</Tag>)}</div>
        </div>
      )}
      {ql && (
        <div style={{ paddingTop: 24 }}>
          <Tabs value={tab} onChange={setTab} items={items} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48, paddingTop: 32 }}>
            {(tab === 'all' || tab === 'artists') && ar.length > 0 && <div><SectionHeader size="sm" title="Artists" as="h2" /><div>{ar.map(a => <ArtistRow key={a.name} name={a.name} songs={a.songCount} shows={a.showCount} tags={a.tags} onClick={() => go('artist', a.name)} />)}</div></div>}
            {(tab === 'all' || tab === 'shows') && sh.length > 0 && <div><SectionHeader size="sm" title="Shows" as="h2" /><ShowList>{sh.map(s => <ShowRow key={s.date} date={s.date} title={s.title} description={s.description} trackCount={s.tracks.length} onClick={() => go('show', s.date)} />)}</ShowList></div>}
            {(tab === 'all' || tab === 'tracks') && tracks.length > 0 && <div><SectionHeader size="sm" title="Tracks" as="h2" /><TrackList wide columns={['Song','Artist','Show','Aired']} tracks={tracks} playingIndex={pIdx} paused={!playing} onPlay={(i, t) => play(t._s, t._i)} onArtist={a => go('artist', a)} onCopyLink={() => toast('Track link copied')} /></div>}
            {items[0].count === 0 && <p style={{ font: '400 18px/1.5 var(--font-text)', color: 'var(--fg-2)' }}>Nothing in the archive matches “{q}”.</p>}
          </div>
        </div>
      )}
    </div>
  );
};
