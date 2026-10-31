window.CAK = window.CAK || {};
CAK.About = function About({ toast }) {
  return (
    <div className="kit-page">
      <header style={{ padding: '48px 0 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Label tone="accent">About</Label>
        <h1 className="kit-h1">About Cyprus Avenue</h1>
      </header>
      <div className="kit-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 64, alignItems: 'start' }}>
        <article className="ca-prose">
          <p className="ca-lede">Cyprus Avenue was a Saturday evening institution on KCUR 89.3 FM in Kansas City, featuring "the world of popular music from gospel to rock - from country to reggae - from a different point of view." The show was named after Van Morrison's iconic song "Cyprus Avenue" from the 1968 album <em>Astral Weeks</em>.</p>
          <p>For over 40 years (1978-2018), Bill Shapiro—a Kansas City tax and estate planner by day and music enthusiast by night—curated unique playlists introducing listeners to both classic and contemporary artists across all genres. A native of Kansas City, Missouri, Shapiro received his law degree from the University of Michigan and practiced law since 1962.</p>
          <p>Beyond the radio, Shapiro was the author of two definitive music guides, both published by Andrews &amp; McMeel: <a href="https://www.amazon.com/dp/0836279476"><em>The CD Rock and Roll Library</em></a> (1988) and <a href="https://www.amazon.com/dp/0836262174"><em>The Rock and Roll Review</em></a> (1991). His taste and deep knowledge of music made Cyprus Avenue a beloved show for generations of Kansas City listeners.</p>
          <p>Bill Shapiro passed away in January 2020 at age 82, but his musical legacy lives on. Read more about his life and impact at <a href="https://www.kcur.org/community/2020-01-23/bill-shapiro-longtime-host-of-kcurs-cyprus-avenue-dies-at-82">KCUR</a>.</p>
          <h2>Marr Sound Archive</h2>
          <p>More recordings appear to be available as part of the <strong>Marr Sound Archive</strong> at the University of Missouri Kansas City. The archive was founded by Professor Gaylord Marr, who specialized in sound recordings. This collection contains audio recordings of the "Cyprus Avenue" radio program aired on KCUR-FM in Kansas City, Missouri.</p>
          <p><a href="https://finding-aids.library.umkc.edu/repositories/2/resources/415/collection_organization">Marr Sound Archive: Cyprus Avenue Collection</a></p>
          <h2>About this project</h2>
          <p>This project originally began in 2018 as a manual preservation effort. At the time, the work consisted primarily of copying and pasting as many playlists as possible from the KCUR website before they disappeared. You can read more about the original motivation in this 2018 blog post: <a href="https://riebschlager.medium.com/the-cyprus-avenue-preservation-project-5fa0a3894c3a">The Cyprus Avenue Preservation Project</a>.</p>
          <p>The inspiration back then was a growing nostalgia for human-curated music in an era where streaming services and algorithmically generated playlists were already beginning to dominate.</p>
        </article>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 40, position: 'sticky', top: 96 }}>
          <div>
            <SectionHeader size="sm" title="Download the archive" as="h3" />
            <p style={{ font: '400 15px/1.5 var(--font-text)', color: 'var(--fg-2)', marginBottom: 16 }}>All 125 playlists with 1,506 tracks.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button variant="secondary" icon="braces" block onClick={() => toast('Downloaded playlists.json')}>JSON</Button>
              <Button variant="secondary" icon="sheet" block onClick={() => toast('Downloaded playlists.csv')}>CSV</Button>
              <Button variant="secondary" icon="file-text" block onClick={() => toast('Downloaded playlists.txt')}>Text</Button>
            </div>
          </div>
          <div>
            <SectionHeader size="sm" title="Contact" as="h3" />
            <p style={{ font: '400 15px/1.5 var(--font-text)', color: 'var(--fg-2)' }}>The project is open source on <a href="https://github.com/riebschlager/cyprus-avenue/">GitHub</a>. Corrections welcome at <a href="mailto:chris@the816.com">chris@the816.com</a>.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};
