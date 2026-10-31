`Tabs` for switching result groups; `AlphaIndex` for the artist directory.

```jsx
<Tabs value={tab} onChange={setTab} items={[{value:'all',label:'All',count:42},{value:'shows',label:'Shows',count:3}]} />
<AlphaIndex value={letter} onChange={setLetter} available={['A','B','D']} />
```
