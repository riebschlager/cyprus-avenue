Square icon-only button for secondary actions (copy link, more, close); `PlayButton` is the round orange play/pause.

```jsx
<IconButton icon="link" label="Copy link to track" size="sm" />
<IconButton icon="x" label="Close" />
<PlayButton playing={false} size="lg" />
```

- Always pass `label`.
- `reveal` hides the button until its track row is hovered.
