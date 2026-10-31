Form controls for filtering the archive: `Select`, `SegmentedControl`, `Checkbox`.

```jsx
<Select label="Year" value={y} onChange={setY} options={['All years','2017','2016','2015']} />
<SegmentedControl value={sort} onChange={setSort} options={['Newest','Oldest','A–Z']} />
<Checkbox checked={onlySpotify} onChange={setOnlySpotify}>Only tracks on Spotify</Checkbox>
```
