/**
 * Generates a URL-friendly slug from a playlist title and date
 * Example: "Cyprus Avenue: March 25, 2017" + "2017-03-25" -> "cyprus-avenue-march-25-2017"
 */
export function generatePlaylistSlug(title: string, date: string): string {
  // Parse the date
  const dateObj = new Date(date)
  const month = dateObj.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()
  const day = dateObj.getDate()
  const year = dateObj.getFullYear()

  // Clean the title: remove "Cyprus Avenue:" prefix if present
  let cleanTitle = title.replace(/^Cyprus Avenue:?\s*/i, '').trim()

  // Convert to slug format
  cleanTitle = cleanTitle
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .trim()

  // Combine title with date
  return `${cleanTitle}-${month}-${day}-${year}`
}

/**
 * Finds a playlist by its slug
 */
export function findPlaylistBySlug(playlists: any[], slug: string): any | null {
  return playlists.find(p => generatePlaylistSlug(p.title, p.date) === slug) || null
}

/**
 * Generates a URL-friendly slug from an artist name
 * Example: "Bill Frisell" -> "bill-frisell"
 */
export function generateArtistSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .trim()
}

/**
 * Finds an artist by slug
 */
export function findArtistBySlug(artists: any[], slug: string): any | null {
  return artists.find(a => generateArtistSlug(a.name) === slug) || null
}
