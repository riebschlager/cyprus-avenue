window.CAK = window.CAK || {};
CAK.ShowDetail = function ShowDetail({ date, go, play, nowPlaying, playing, toast, spotify }) {
  const { shows } = window.CA_DATA;
  const i = shows.findIndex(s => s.date === date);
  const show = shows[i] || shows[0];
  const prev = shows[i + 1], next = shows[i - 1];
  const [dl, setDl] = React.useState(false);
  const artists = [...new Set(show.tracks.map(t => t.artist))];
  const playingIdx = nowPlaying && nowPlaying.show === show.date ? nowPlaying.index : null;
  return (
    <div className="kit-page">
      <a href="#" className="kit-back" onClick={e => { e.preventDefault(); go('shows'); }}><Icon name="arrow-left" /> All shows</a>
      <header className="kit-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 240px', gap: 48, padding: '24px 0 40px', alignItems: 'end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Label tone="accent">Cyprus Avenue · Show</Label>
          <h1 style={{ font: '850 clamp(40px, 6vw, 72px)/0.95 var(--font-display)', letterSpacing: '-0.04em', margin: 0, textWrap: 'balance' }}>{show.title}</h1>
          <p style={{ font: '400 20px/1.5 var(--font-text)', maxWidth: 680, textWrap: 'pretty' }}>{show.description}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: 'var(--rule-ink)', paddingTop: 14 }}>
          <DateStamp date={show.date} variant="block" weekday />
          <Label>{show.tracks.length} track{show.tracks.length === 1 ? '' : 's'} · {artists.length} artist{artists.length === 1 ? '' : 's'}</Label>
        </div>
      </header>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingBottom: 24, position: 'relative' }}>
        <Button variant="accent" icon={playingIdx != null && playing ? 'pause' : 'play'} onClick={() => play(show, playingIdx ?? 0)}>{playingIdx != null && playing ? 'Pause' : 'Play show'}</Button>
        <Button variant="secondary" icon="list-plus" onClick={() => spotify(show)}>Add to Spotify</Button>
        <span style={{ position: 'relative' }}>
          <Button variant="ghost" icon="download" iconRight="chevron-down" onClick={() => setDl(d => !d)}>Download</Button>
          {dl && <Menu label="Download as" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0 }} items={[{label:'JSON',icon:'braces',hint:'.json',onClick:()=>{setDl(false);toast('Downloaded ' + show.date + '.json');}},{label:'CSV',icon:'sheet',hint:'.csv',onClick:()=>{setDl(false);toast('Downloaded ' + show.date + '.csv');}},{label:'Text',icon:'file-text',hint:'.txt',onClick:()=>{setDl(false);toast('Downloaded ' + show.date + '.txt');}}]} />}
        </span>
        <IconButton icon="link" label="Copy link to show" onClick={() => toast('Link copied')} />
      </div>
      <div className="kit-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 48, alignItems: 'start' }}>
        <TrackList tracks={show.tracks} playingIndex={playingIdx} paused={!playing} onPlay={idx => play(show, idx)} onArtist={a => go('artist', a)} onCopyLink={() => toast('Track link copied')} />
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div>
            <SectionHeader size="sm" title="In this show" as="h3" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {artists.map(a => <a key={a} href="#" onClick={e => { e.preventDefault(); go('artist', a); }} style={{ font: '500 14px/1.35 var(--font-ui)' }}>{a}</a>)}
            </div>
          </div>
          <div>
            <SectionHeader size="sm" title="More shows" as="h3" />
            <ShowList>
              {prev && <ShowRow compact date={prev.date} title={prev.title} trackCount={prev.tracks.length} onClick={() => go('show', prev.date)} />}
              {next && <ShowRow compact date={next.date} title={next.title} trackCount={next.tracks.length} onClick={() => go('show', next.date)} />}
            </ShowList>
          </div>
          <Button variant="link" href={'mailto:chris@the816.com?subject=Cyprus Avenue Archive - Issue Report'}>Report an issue with this playlist</Button>
        </aside>
      </div>
    </div>
  );
};
