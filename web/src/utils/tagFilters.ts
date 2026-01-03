/**
 * Utility for filtering and normalizing musical tags/genres
 */

/**
 * Tags that should be completely ignored as they are not useful categories
 */
export const TAG_BLACKLIST = new Set([
  'All',
  'Funk_add_to_lidarr_batch_4',
  'Audiobooks',
  'Audiobook',
  'Books',
  'Book',
  'Unknown',
  'Various Artists',
  'Favorite',
  'Favorites',
  'Seen Live',
  'My Collection',
  'Owned',
  'Import',
  'Buy',
  'Checked',
  'Checked Out',
  'Top',
  'User',
  'Check',
  'Spotify',
  'Discover',
  'Archive'
])

/**
 * Mappings for common spelling variations or redundant tags
 * Format: 'Source Tag': 'Canonical Tag'
 */
export const TAG_MAPPINGS: Record<string, string> = {
  'Acapella': 'A Cappella',
  'Acousic': 'Acoustic',
  'Female Vocalists': 'Female Vocalist',
  'RnB': 'R&B',
  'Rhythm and Blues': 'R&B',
  'Hip Hop': 'Hip-Hop',
  'Post Rock': 'Post-Rock',
  'Electronic': 'Electronica',
  'Indie Rock': 'Indie',
  'Indie Pop': 'Indie',
  'Alternative Rock': 'Alternative',
  'Alt Country': 'Alternative Country',
  'Alt-Country': 'Alternative Country',
  'Rock N Roll': 'Rock & Roll',
  'Rock and Roll': 'Rock & Roll',
  'Soul Music': 'Soul',
  'Americana Music': 'Americana',
  'Jazz Music': 'Jazz',
  'Classical Music': 'Classical'
}

/**
 * Normalizes a raw tag string to Title Case
 */
function toTitleCase(tag: string): string {
  return tag
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Processes a raw tag:
 * 1. Converts to Title Case
 * 2. Applies mappings to canonical versions
 * 3. Checks against blacklist
 * 
 * Returns the normalized tag or null if it should be filtered out
 */
export function normalizeAndFilterTag(rawTag: string): string | null {
  if (!rawTag) return null

  // 1. Initial Title Case conversion for consistent mapping keys
  let tag = toTitleCase(rawTag.trim())

  // 2. Apply Mappings
  const mapped = TAG_MAPPINGS[tag]
  if (mapped) {
    tag = mapped
  }

  // 3. Check Blacklist
  if (TAG_BLACKLIST.has(tag)) {
    return null
  }

  // 4. Final check for very short or numeric tags that are usually garbage
  if (tag.length <= 2 || /^\d+$/.test(tag)) {
    return null
  }

  return tag
}
