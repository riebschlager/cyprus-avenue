Text button for actions. One `primary` or `accent` per view; everything else secondary/ghost.

```jsx
<Button variant="accent" icon="list-music">Add to Spotify</Button>
<Button variant="secondary" iconRight="arrow-right">Browse shows</Button>
<Button variant="ghost" size="sm" icon="download">Download</Button>
```

- `accent` (orange) is reserved for listening actions: play, add to Spotify.
- `primary` (ink) for everything else that commits.
- Labels are sentence case, verb first.
