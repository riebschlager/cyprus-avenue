/**
 * Utility for filtering and normalizing musical tags/genres
 */

/**
 * Tags that should be completely ignored as they are not useful categories
 */
export const TAG_BLACKLIST = new Set([
  'All',
  '00s',
  '50s',
  '60s',
  '70s',
  '80s',
  'Funk_add_to_lidarr_batch_4',
  'Spoken Word',
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
  'Archive',
  'Under 2000 listeners',
  'Country Favorites',
  'cowhat fav',
  'Chess Records',
  'Goldwax',
  'American',
  'USA',
  'United States',
  'United States Of America',
  'Canadian',
  'British',
  'Australian',
  'Irish',
  'Spanish',
  'Indian',
  'South African',
  'Minnesota',
  'Texas',
  'Austin',
  'New Orleans',
  'Jamaica',
  'Jamaican',
  'Bob Marley',
  'The Doors',
  'Velvet Underground',
  'Waylon Jennings',
  'Ashley Monroe',
  'Gary Stewart',
  'George Jones',
  'Jimi Hendrix',
  'Marty Stuart',
  'The Judds',
  'Bobby Bare',
  'Christine Hynde',
  'Christine  Hynde'
])

/**
 * Mappings for common spelling variations or redundant tags
 * Format: 'Source Tag': 'Canonical Tag'
 */
export const TAG_MAPPINGS: Record<string, string> = {
  'Acapella': 'A Cappella',
  'A Capella': 'A Cappella',
  'Acousic': 'Acoustic',
  'AOR': 'AOR',
  'Blue Grass': 'Bluegrass',
  'Boogie Woogie': 'Boogie-Woogie',
  'Boogie-Woogie': 'Boogie-Woogie',
  'Doo Wop': 'Doo-Wop',
  'Doo-Wop': 'Doo-Wop',
  'Female Vocalists': 'Female Vocalist',
  'Hip-Hop': 'Hip-Hop',
  'RnB': 'R&B',
  'Rhythm and Blues': 'R&B',
  'Hip Hop': 'Hip-Hop',
  'Post Rock': 'Post-Rock',
  'Post-Rock': 'Post-Rock',
  'Electronic': 'Electronica',
  'Indie Rock': 'Indie',
  'Indie Pop': 'Indie',
  'Alternative Rock': 'Alternative',
  'Alt Country': 'Alternative Country',
  'Alt-Country': 'Alternative Country',
  'Powerpop': 'Power Pop',
  'Rock N Roll': 'Rock & Roll',
  "Rock N' Roll": 'Rock & Roll',
  'Rock and Roll': 'Rock & Roll',
  'Rock And Roll': 'Rock & Roll',
  'Rock': 'Rock & Roll',
  'Singer': 'Singer Songwriter',
  'Singer Songwriters': 'Singer Songwriter',
  'Soul Music': 'Soul',
  'Americana Music': 'Americana',
  'Jazz Music': 'Jazz',
  'Classical Music': 'Classical',
  'Tex Mex': 'Tex-Mex',
  'Tex-Mex': 'Tex-Mex',
  'vocals': 'Vocal',
  'rnb': 'R&B',
  'r&b': 'R&B',
  'Girl Groups': 'Girl Group',
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
 * 1. Checks against blacklist (case-insensitive)
 * 2. Applies mappings to canonical versions (case-insensitive)
 * 3. Normalizes to Title Case
 * 
 * Returns the normalized tag or null if it should be filtered out
 */
export function normalizeAndFilterTag(rawTag: string): string | null {
  if (!rawTag) return null

  const trimmed = rawTag.trim()
  const lowercase = trimmed.toLowerCase()

  // 1. Check Blacklist (case-insensitive)
  const isBlacklisted = Array.from(TAG_BLACKLIST).some(b => b.toLowerCase() === lowercase)
  if (isBlacklisted) {
    return null
  }

  // 2. Apply Mappings (case-insensitive)
  let tag: string | null = null
  
  // Look for a mapping key that matches (case-insensitive)
  for (const [source, canonical] of Object.entries(TAG_MAPPINGS)) {
    if (source.toLowerCase() === lowercase) {
      tag = canonical
      break
    }
  }

  // 3. If no mapping found, use Title Case of the original
  if (!tag) {
    tag = toTitleCase(trimmed)
  }

  // 4. Final check for very short or numeric tags that are usually garbage
  if (tag.length <= 2 || /^\d+$/.test(tag)) {
    return null
  }

  return tag
}
