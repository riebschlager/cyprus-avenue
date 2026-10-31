The core listing unit: numbered tracks. Hover swaps the number for a play button; the playing row shows an equalizer.

```jsx
<TrackList tracks={show.tracks} playingIndex={2} onPlay={(i,t) => play(t)} />
<TrackList wide columns={['Song','Artist','Show','Aired']} tracks={results} />
```

- Song title is the heaviest element in a row; artist is a secondary link.
- Row actions (copy link, streaming) reveal on hover; always visible on touch.
