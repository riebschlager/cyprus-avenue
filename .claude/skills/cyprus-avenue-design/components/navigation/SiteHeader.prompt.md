Masthead and footer. The wordmark is set in type (Schibsted Grotesk 850, uppercase); there is no logo asset.

```jsx
<SiteHeader current="shows" onNavigate={setPage} onSearch={() => setPage('search')} />
<SiteFooter onNavigate={setPage} />
```

- Active nav item gets a 3px label-orange underline.
