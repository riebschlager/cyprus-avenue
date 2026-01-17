// Fuzzy matching utilities for artist names

// Normalize a string for comparison
export function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity score (0-1)
export function similarity(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);

  if (normA === normB) return 1;

  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(normA, normB);
  return 1 - distance / maxLen;
}

// Find best matching artist from a list
export function findBestMatch(
  query: string,
  candidates: string[],
  threshold = 0.6
): { match: string | null; score: number; suggestions: string[] } {
  const normalizedQuery = normalize(query);

  // First, try exact match (case-insensitive)
  const exactMatch = candidates.find((c) => normalize(c) === normalizedQuery);
  if (exactMatch) {
    return { match: exactMatch, score: 1, suggestions: [] };
  }

  // Calculate scores for all candidates
  const scored = candidates.map((candidate) => ({
    candidate,
    score: similarity(query, candidate),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Get best match if above threshold
  const best = scored[0];
  if (best && best.score >= threshold) {
    return {
      match: best.candidate,
      score: best.score,
      suggestions: scored.slice(1, 4).map((s) => s.candidate),
    };
  }

  // No match, return suggestions
  return {
    match: null,
    score: best?.score || 0,
    suggestions: scored.slice(0, 5).map((s) => s.candidate),
  };
}

// Check if a query contains a substring match
export function containsMatch(query: string, candidates: string[]): string[] {
  const normalizedQuery = normalize(query);
  return candidates.filter((c) => {
    const normalizedCandidate = normalize(c);
    return (
      normalizedCandidate.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedCandidate)
    );
  });
}
