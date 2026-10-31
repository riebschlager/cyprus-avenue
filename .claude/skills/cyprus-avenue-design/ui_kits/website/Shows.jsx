window.CAK = window.CAK || {};
CAK.Shows = function Shows({ go }) {
  const { shows } = window.CA_DATA;
  const [q, setQ] = React.useState('');
  const [year, setYear] = React.useState('All years');
  const [sort, setSort] = React.useState('Newest');
  let list = shows.filter(s => (year === 'All years' || s.date.startsWith(year)) &&
    (!q || (s.title + ' ' + s.description + ' ' + s.tracks.map(t => t.artist + ' ' + t.song).join(' ')).toLowerCase().includes(q.toLowerCase())));
  list = [...list].sort((a, b) => sort === 'Oldest' ? a.date.localeCompare(b.date) : sort === 'A–Z' ? a.title.localeCompare(b.title) : b.date.localeCompare(a.date));
  return (
    <div className="kit-page">
      <header style={{ padding: '48px 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Label tone="accent">Archive</Label>
        <h1 className="kit-h1">Shows</h1>
        <p style={{ font: '400 19px/1.5 var(--font-text)', color: 'var(--fg-2)', maxWidth: 620 }}>Every recovered playlist, December 2009 to July 2017. Each show aired Saturday night on KCUR 89.3.</p>
      </header>
      <div className="kit-filters">
        <div style={{ flex: '1 1 280px' }}><SearchField value={q} onChange={setQ} placeholder="Filter by title, artist or song" /></div>
        <Select value={year} onChange={setYear} options={['All years','2017','2016','2015','2014','2013']} />
        <SegmentedControl value={sort} onChange={setSort} options={['Newest','Oldest','A–Z']} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 0 10px' }}>
        <Label>{list.length} of 125 shows</Label>
      </div>
      <ShowList>
        {list.map(s => <ShowRow key={s.date} date={s.date} title={s.title} description={s.description} trackCount={s.tracks.length} onClick={() => go('show', s.date)} />)}
      </ShowList>
      {list.length === 0 && <p style={{ padding: '48px 0', font: '400 18px/1.5 var(--font-text)', color: 'var(--fg-2)' }}>No shows match “{q}”. Try an artist name.</p>}
    </div>
  );
};
