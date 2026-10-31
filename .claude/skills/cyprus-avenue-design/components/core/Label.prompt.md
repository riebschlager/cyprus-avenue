`Label` is the mono eyebrow; `DateStamp` formats broadcast dates consistently.

```jsx
<Label tone="accent">This week in history</Label>
<DateStamp date="2015-01-03" />            // 03 JAN 2015
<DateStamp date="2015-01-03" variant="block" weekday />
```

- Dates are always `DD MON YYYY`, never "1/3/15" or raw ISO.
