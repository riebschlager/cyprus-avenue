// Mood to tag mappings for natural language queries
export const MOOD_MAPPINGS: Record<string, string[]> = {
  // Emotional moods
  upbeat: ['soul', 'funk', 'motown', 'rock & roll', 'pop'],
  melancholy: ['blues', 'soul blues', 'singer-songwriter', 'folk'],
  reflective: ['folk', 'singer-songwriter', 'americana', 'acoustic'],
  energetic: ['rock', 'rock & roll', 'rockabilly', 'punk'],
  romantic: ['soul', 'classic soul', 'jazz', 'vocal jazz', 'doo-wop'],
  nostalgic: ['oldies', 'classic rock', 'doo-wop', 'motown', '60s', '70s'],
  rebellious: ['rock', 'punk', 'outlaw country', 'blues rock'],
  peaceful: ['folk', 'acoustic', 'singer-songwriter', 'jazz'],
  soulful: ['soul', 'classic soul', 'gospel', 'rhythm and blues', 'r&b'],
  rootsy: ['americana', 'bluegrass', 'country', 'folk', 'roots rock'],
  funky: ['funk', 'soul', 'r&b', 'motown'],
  bluesy: ['blues', 'blues rock', 'soul blues', 'electric blues'],
  jazzy: ['jazz', 'vocal jazz', 'swing', 'bebop'],
  country: ['country', 'outlaw country', 'alt country', 'americana'],
  folksy: ['folk', 'folk rock', 'singer-songwriter', 'acoustic'],

  // Activity-based
  party: ['funk', 'soul', 'motown', 'rock & roll', 'disco'],
  'road trip': ['rock', 'country', 'americana', 'classic rock'],
  'rainy day': ['blues', 'jazz', 'singer-songwriter', 'folk'],
  working: ['jazz', 'acoustic', 'folk', 'instrumental'],
  relaxing: ['folk', 'acoustic', 'jazz', 'singer-songwriter'],
  dancing: ['funk', 'soul', 'motown', 'disco', 'rock & roll'],

  // Seasonal
  summer: ['reggae', 'soul', 'funk', 'rock'],
  winter: ['folk', 'acoustic', 'singer-songwriter'],
  holiday: ['christmas', 'gospel', 'holiday'],
  christmas: ['christmas', 'gospel', 'holiday'],
};

// Era to tag mappings
export const ERA_MAPPINGS: Record<string, { description: string; tags: string[] }> = {
  '50s': {
    description: "1950s rock & roll, doo-wop, early R&B",
    tags: ['50s', 'doo-wop', 'rock & roll', 'rockabilly', 'early rock'],
  },
  '60s': {
    description: "British Invasion, Motown, folk revival, psychedelia",
    tags: ['60s', 'motown', 'british invasion', 'folk', 'psychedelic'],
  },
  '70s': {
    description: "Classic rock, soul, disco, punk",
    tags: ['70s', 'classic rock', 'soul', 'funk', 'disco', 'punk'],
  },
  '80s': {
    description: "New wave, synth-pop, hair metal, post-punk",
    tags: ['80s', 'new wave', 'pop', 'rock', 'synth-pop'],
  },
  '90s': {
    description: "Grunge, alternative, hip-hop golden age",
    tags: ['90s', 'alternative', 'grunge', 'indie'],
  },
  'classic soul': {
    description: "Golden age of soul music (1960s-70s)",
    tags: ['classic soul', 'motown', 'soul', 'rhythm and blues', 'r&b'],
  },
  'classic rock': {
    description: "Rock music from 1960s-80s",
    tags: ['classic rock', 'rock', 'blues rock', 'hard rock'],
  },
  americana: {
    description: "Roots music blending country, folk, blues",
    tags: ['americana', 'alt country', 'roots rock', 'folk', 'country rock'],
  },
  'british invasion': {
    description: "UK bands of the 1960s",
    tags: ['british invasion', '60s', 'rock', 'pop'],
  },
  motown: {
    description: "The Motown sound - Detroit soul",
    tags: ['motown', 'soul', 'r&b', 'classic soul'],
  },
  'new orleans': {
    description: "New Orleans R&B, jazz, and funk",
    tags: ['new orleans', 'jazz', 'funk', 'r&b', 'blues'],
  },
};

// Keywords that suggest era-based queries
export const ERA_KEYWORDS = [
  '50s', '1950s', 'fifties',
  '60s', '1960s', 'sixties',
  '70s', '1970s', 'seventies',
  '80s', '1980s', 'eighties',
  '90s', '1990s', 'nineties',
  'classic rock', 'classic soul',
  'americana', 'british invasion', 'motown',
  'new orleans',
];

// Detect if a query is mood or era based
export function detectQueryType(query: string): 'mood' | 'era' | 'unknown' {
  const lowerQuery = query.toLowerCase().trim();

  // Check for era keywords
  for (const keyword of ERA_KEYWORDS) {
    if (lowerQuery.includes(keyword)) {
      return 'era';
    }
  }

  // Check for era mapping keys
  if (ERA_MAPPINGS[lowerQuery]) {
    return 'era';
  }

  // Check for mood mapping keys
  if (MOOD_MAPPINGS[lowerQuery]) {
    return 'mood';
  }

  // Default to mood for general descriptive terms
  return 'unknown';
}

// Get tags for a query
export function getTagsForQuery(query: string, queryType?: 'mood' | 'era' | 'auto'): string[] {
  const lowerQuery = query.toLowerCase().trim();
  const detectedType = queryType === 'auto' || !queryType ? detectQueryType(lowerQuery) : queryType;

  if (detectedType === 'era') {
    // Try exact match first
    if (ERA_MAPPINGS[lowerQuery]) {
      return ERA_MAPPINGS[lowerQuery].tags;
    }
    // Try partial matches
    for (const [era, data] of Object.entries(ERA_MAPPINGS)) {
      if (lowerQuery.includes(era) || era.includes(lowerQuery)) {
        return data.tags;
      }
    }
  }

  if (detectedType === 'mood' || detectedType === 'unknown') {
    // Try exact match first
    if (MOOD_MAPPINGS[lowerQuery]) {
      return MOOD_MAPPINGS[lowerQuery];
    }
    // Try partial matches
    for (const [mood, tags] of Object.entries(MOOD_MAPPINGS)) {
      if (lowerQuery.includes(mood) || mood.includes(lowerQuery)) {
        return tags;
      }
    }
  }

  // Return empty if no match
  return [];
}
