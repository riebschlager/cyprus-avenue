// Parse into an inert document, then render only Vue-escaped text. Attribution
// links are authored explicitly by the UI, never supplied as provider markup.
export function biographyText(html: string): string {
  if (!html.includes('<') && !html.includes('&')) return html
  const document = new DOMParser().parseFromString(html, 'text/html')
  document.querySelectorAll('script, style, iframe, object').forEach(node => node.remove())
  document.querySelectorAll('a').forEach(node => {
    if (node.textContent?.trim() === 'Read more on Last.fm') node.remove()
  })
  return document.body.textContent?.trim() || ''
}
