window.CAK = window.CAK || {};
CAK.Home = function Home({ go, play }) {
  const { shows, artists, stats } = window.CA_DATA;
  const week = shows.filter(s => ['2014-11-01','2014-10-25'].includes(s.date));
  const [feature, ...restWeek] = week;
  const more = shows.filter(s => !week.includes(s)).slice(0, 3);
  const surprise = () => go('show', shows[Math.floor(Math.random() * shows.length)].date);
  return (
    <div className="kit-page">
      <section style={{ padding: '56px 0 48px', display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 48, alignItems: 'end' }} className="kit-hero">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Label tone="accent">Saturday nights on KCUR 89.3 · 1978–2018</Label>
          <h1 style={{ font: '850 clamp(48px, 8vw, 96px)/0.9 var(--font-display)', letterSpacing: '-0.045em', margin: 0 }}>The Cyprus Avenue Archive</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ font: '400 21px/1.45 var(--font-text)', color: 'var(--fg-1)', textWrap: 'pretty' }}>A digital preservation of Bill Shapiro's legendary KCUR radio show, celebrating over 40 years of musical discovery and cultural heritage.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="primary" iconRight="arrow-right" onClick={() => go('shows')}>Browse shows</Button>
            <Button variant="secondary" icon="shuffle" onClick={surprise}>Surprise me</Button>
          </div>
        </div>
      </section>

      <StatRow>
        <Stat value={stats.shows} label="Shows archived" />
        <Stat value={stats.tracks} label="Tracks" />
        <Stat value={stats.artists} label="Artists" />
        <Stat value="8" label="Years of playlists" />
      </StatRow>

      <section style={{ marginTop: 80 }}>
        <SectionHeader kicker="01" title="This week in history" action={<Label>Shows aired near 31 Oct</Label>} />
        <div className="kit-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 32, alignItems: 'start' }}>
          <ShowCard variant="feature" eyebrow={'On air ' + feature.date.slice(0,4)} date={feature.date} title={feature.title} description={feature.description}
            onClick={() => go('show', feature.date)}>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }} onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
              <Button variant="primary" icon="play" onClick={() => play(feature, 0)}>Play show</Button>
              <Button variant="ghost" onClick={() => go('show', feature.date)}>{feature.tracks.length} tracks</Button>
            </div>
          </ShowCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {restWeek.map(s => <ShowCard key={s.date} date={s.date} title={s.title} trackCount={s.tracks.length} description={s.description} artists={[...new Set(s.tracks.map(t => t.artist))]} onClick={() => go('show', s.date)} />)}
          </div>
        </div>
      </section>

      <section style={{ marginTop: 80 }}>
        <SectionHeader kicker="02" title="From the archive" action={<Button variant="link" iconRight="arrow-right" onClick={() => go('shows')}>All 125 shows</Button>} />
        <div className="kit-grid3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 32 }}>
          {more.map(s => <ShowCard key={s.date} date={s.date} title={s.title} trackCount={s.tracks.length} description={s.description} onClick={() => go('show', s.date)} />)}
        </div>
      </section>

      <section className="kit-split" style={{ marginTop: 80, display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 48, alignItems: 'start' }}>
        <div style={{ borderTop: 'var(--rule-heavy)', paddingTop: 32 }}>
          <PullQuote cite="KCUR show description">The world of popular music from gospel to rock, from country to reggae, from a different point of view.</PullQuote>
        </div>
        <div>
          <SectionHeader size="sm" title="Most played here" action={<Button variant="link" onClick={() => go('artists')}>Artists</Button>} />
          <div>
            {[...artists].sort((a, b) => b.tracks.length - a.tracks.length).slice(0, 5).map((a, i) => (
              <a key={a.name} href="#" onClick={e => { e.preventDefault(); go('artist', a.name); }} className="kit-rank">
                <span className="ca-label">{String(i + 1).padStart(2, '0')}</span>
                <span style={{ font: '700 18px/1.2 var(--font-display)', letterSpacing: '-0.015em', flex: 1 }}>{a.name}</span>
                <span className="ca-label ca-label--sm">{a.tracks.length} plays</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
