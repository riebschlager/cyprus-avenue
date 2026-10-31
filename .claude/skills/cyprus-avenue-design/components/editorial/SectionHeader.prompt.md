Editorial primitives: `SectionHeader` (ruled opener), `StatRow`/`Stat`, `PullQuote`.

A full-size `SectionHeader` opens a `.ca-section`. The section owns the space above it (`--space-section`), and the header owns the 32px below it. Don't add top margin to the header itself: the `--sm` variant also appears inside nested layouts (asides, cards).

```jsx
<section className="ca-section">
  <SectionHeader kicker="01" title="About Cyprus Avenue" />
  …
</section>
<SectionHeader kicker="01" title="This week in history" action={<Button variant="link" iconRight="arrow-right">All shows</Button>} />
<StatRow><Stat value="125" label="Shows" /><Stat value="1,506" label="Tracks" /></StatRow>
<PullQuote cite="KCUR show description">The world of popular music from gospel to rock…</PullQuote>
```
