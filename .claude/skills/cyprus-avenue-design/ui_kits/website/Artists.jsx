window.CAK = window.CAK || {};
CAK.letterOf = n => { const c = n.replace(/^The /, '')[0].toUpperCase(); return /[A-Z]/.test(c) ? c : '#'; };
CAK.Artists = function Artists({ go }) {
  const { artists, tagCounts } = window.CA_DATA;
  const [letter, setLetter] = React.useState(null);
  const [tag, setTag] = React.useState(null);
  const avail = [...new Set(artists.map(a => CAK.letterOf(a.name)))];
  const list = artists.filter(a => (!letter || CAK.letterOf(a.name) === letter) && (!tag || a.tags.includes(tag)));
  const groups = {};
  list.forEach(a => (groups[CAK.letterOf(a.name)] = groups[CAK.letterOf(a.name)] || []).push(a));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  return (
    <div className="kit-page">
      <header style={{ padding: '48px 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Label tone="accent">Index</Label>
        <h1 className="kit-h1">Artists</h1>
        <p style={{ font: '400 19px/1.5 var(--font-text)', color: 'var(--fg-2)', maxWidth: 620 }}>277 artists, from gospel quartets to the Boss. Tags come from Last.fm and Spotify.</p>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
        <AlphaIndex value={letter} onChange={setLetter} available={avail} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {topTags.map(([t, n]) => <Tag key={t} count={n} active={tag === t} onClick={() => setTag(tag === t ? null : t)}>{t}</Tag>)}
        </div>
      </div>
      {Object.keys(groups).sort().map(L => (
        <section key={L} style={{ display: 'grid', gridTemplateColumns: '80px minmax(0,1fr)', gap: 16, borderTop: 'var(--rule-ink)' }} className="kit-letter">
          <div style={{ font: '850 44px/1 var(--font-display)', letterSpacing: '-0.04em', paddingTop: 12 }}>{L}</div>
          <div>{groups[L].map(a => <ArtistRow key={a.name} name={a.name} songs={a.songCount} shows={a.showCount} tags={a.tags} onTag={setTag} onClick={() => go('artist', a.name)} />)}</div>
        </section>
      ))}
    </div>
  );
};

CAK.ArtistDetail = function ArtistDetail({ name, go, play, nowPlaying, playing, toast, spotify }) {
  const { artists, shows } = window.CA_DATA;
  const a = artists.find(x => x.name === name) || artists[0];
  const songs = [...new Map(a.tracks.map(t => [t.song, t])).values()];
  const appears = shows.filter(s => a.shows.has(s.date));
  const pseudo = { date: 'artist:' + a.name, title: a.name, tracks: songs };
  const playingIdx = nowPlaying && nowPlaying.show === pseudo.date ? nowPlaying.index : null;
  return (
    <div className="kit-page">
      <a href="#" className="kit-back" onClick={e => { e.preventDefault(); go('artists'); }}><Icon name="arrow-left" /> All artists</a>
      <header style={{ padding: '24px 0 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Label tone="accent">Artist</Label>
        <h1 style={{ font: '850 clamp(44px, 7vw, 88px)/0.92 var(--font-display)', letterSpacing: '-0.045em', margin: 0 }}>{a.name}</h1>
        {a.tags.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{a.tags.map(t => <Tag key={t} onClick={() => go('artists')}>{t}</Tag>)}</div>}
      </header>
      <StatRow>
        <Stat value={a.tracks.length} label="Times played" />
        <Stat value={a.songCount} label="Unique songs" />
        <Stat value={a.showCount} label="Shows" />
      </StatRow>
      <div style={{ display: 'flex', gap: 8, padding: '32px 0 24px' }}>
        <Button variant="accent" icon="play" onClick={() => play(pseudo, 0)}>Play all</Button>
        <Button variant="secondary" icon="list-plus" onClick={() => spotify(pseudo)}>Create Spotify playlist</Button>
      </div>
      <div className="kit-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 48, alignItems: 'start' }}>
        <div>
          <SectionHeader size="sm" title="Songs" as="h2" action={<Label>{songs.length}</Label>} />
          <TrackList tracks={songs} playingIndex={playingIdx} paused={!playing} onPlay={i => play(pseudo, i)} onArtist={() => {}} onCopyLink={() => toast('Track link copied')} />
        </div>
        <div>
          <SectionHeader size="sm" title="Appears in" as="h2" action={<Label>{appears.length} show{appears.length === 1 ? '' : 's'}</Label>} />
          <ShowList>{appears.map(s => <ShowRow key={s.date} compact date={s.date} title={s.title} trackCount={s.tracks.length} onClick={() => go('show', s.date)} />)}</ShowList>
        </div>
      </div>
    </div>
  );
};
