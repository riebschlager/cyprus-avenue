/** Route paths are relative to the app; public URLs include the deployment base. */
export function getPublicUrl(
  path: string,
  origin = window.location.origin,
  base = import.meta.env.BASE_URL
): string {
  const basePath = `/${base.replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '')
  return new URL(`${basePath}/${path.replace(/^\/+/, '')}`, origin).href
}
