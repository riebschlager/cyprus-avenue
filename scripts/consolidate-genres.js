const { sourcePath, readJSON, saveSnapshot } = require('./lib/source-data.cjs')
const fs = require('fs')

/**
 * Consolidate genre/tag information from multiple sources:
 * 1. Last.fm tags (already in artist-bios.json as lastfmTags)
 * 2. Spotify track genres (from spotify-index.json)
 * 3. Retained Spotify artist genres (refresh separately)
 *
 * Creates a unified "tags" field that merges all sources.
 */

/**
 * Normalize genre/tag strings for comparison
 */
function normalizeGenre(genre) {
  return genre.toLowerCase().trim()
}

/**
 * Merge genres from multiple sources, removing duplicates
 */
function mergeGenres(lastfmTags, spotifyArtistGenres, spotifyTrackGenres) {
  const normalized = new Map() // normalized -> original

  // Add Last.fm tags (highest priority - most specific)
  for (const tag of lastfmTags) {
    const norm = normalizeGenre(tag)
    if (!normalized.has(norm)) {
      normalized.set(norm, tag)
    }
  }

  // Add Spotify artist genres
  for (const genre of spotifyArtistGenres) {
    const norm = normalizeGenre(genre)
    if (!normalized.has(norm)) {
      normalized.set(norm, genre)
    }
  }

  // Add Spotify track genres (lowest priority - most general)
  for (const genre of spotifyTrackGenres) {
    const norm = normalizeGenre(genre)
    if (!normalized.has(norm)) {
      normalized.set(norm, genre)
    }
  }

  return Array.from(normalized.values())
}

/**
 * Extract unique genres from track index for each artist
 */
function extractTrackGenresByArtist(trackIndex) {
  const artistGenres = {}

  for (const [key, track] of Object.entries(trackIndex)) {
    const [artist] = key.split('|')
    const genres = track.genres || []

    if (!artistGenres[artist]) {
      artistGenres[artist] = new Set()
    }

    for (const genre of genres) {
      artistGenres[artist].add(genre)
    }
  }

  // Convert sets to arrays
  for (const artist in artistGenres) {
    artistGenres[artist] = Array.from(artistGenres[artist])
  }

  return artistGenres
}

async function main() {
  console.log('\n🎵 Genre/Tag Consolidation Tool\n')

  // Load data files
  const biosPath = sourcePath('metadata', 'artist-bios.json')
  const indexPath = sourcePath('metadata', 'spotify-index.json')

  if (!fs.existsSync(biosPath)) {
    console.error('❌ artist-bios.json not found')
    process.exit(1)
  }

  if (!fs.existsSync(indexPath)) {
    console.error('❌ spotify-index.json not found')
    process.exit(1)
  }

  const bios = readJSON(biosPath)
  const trackIndex = readJSON(indexPath)

  console.log(`📊 Loaded ${Object.keys(bios).length} artists from artist-bios.json`)
  console.log(`📊 Loaded ${Object.keys(trackIndex).length} tracks from spotify-index.json\n`)

  // Extract track genres by artist
  console.log('⏳ Extracting genres from track index...')
  const trackGenresByArtist = extractTrackGenresByArtist(trackIndex)
  console.log(`✓ Found track genres for ${Object.keys(trackGenresByArtist).length} artists\n`)

  let processed = 0
  let withSpotifyGenres = 0
  let withTrackGenres = 0
  let totalGenresAdded = 0

  console.log('⏳ Consolidating genres for each artist...\n')

  for (const [artistName, bio] of Object.entries(bios)) {
    // Rename existing tags to lastfmTags if needed
    if (bio.tags && !bio.lastfmTags) {
      bio.lastfmTags = bio.tags
    }

    const lastfmTags = bio.lastfmTags || []
    const trackGenres = trackGenresByArtist[artistName] || []

    // Retained provider inputs only: this command never contacts an API.
    const spotifyArtistGenres = bio.spotifyGenres || []
    const legacy = !bio.spotifyGenres && bio.tagSources?.spotifyArtist > 0
    if (spotifyArtistGenres.length) withSpotifyGenres++

    if (trackGenres.length > 0) {
      withTrackGenres++
    }

    // Merge all genre sources
    const mergedTags = mergeGenres(lastfmTags, legacy ? bio.tags : spotifyArtistGenres, trackGenres)
    const tagsAdded = mergedTags.length - lastfmTags.length

    // Update bio with consolidated tags
    bio.tags = mergedTags

    // Add source info for transparency
    bio.tagSources = {
      lastfm: lastfmTags.length,
      spotifyArtist: legacy ? bio.tagSources.spotifyArtist : spotifyArtistGenres.length,
      spotifyTracks: trackGenres.length,
      total: mergedTags.length
    }

    if (tagsAdded > 0) {
      totalGenresAdded += tagsAdded
      console.log(`  ✓ ${artistName}: ${lastfmTags.length} → ${mergedTags.length} tags (+${tagsAdded})`)
    } else {
      console.log(`  ⏭️  ${artistName}: ${mergedTags.length} tags (no additions)`)
    }

    processed++

    // Show progress every 50 artists
    if (processed % 50 === 0) {
      console.log(`\n  📈 Progress: ${processed}/${Object.keys(bios).length} (${Math.round(processed / Object.keys(bios).length * 100)}%)\n`)
    }
  }

  // Write updated data
  saveSnapshot('artist-bios.json', bios)

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log(`✅ Tag consolidation complete`)
  console.log(`${'='.repeat(60)}`)
  console.log(`📊 Statistics:`)
  console.log(`   Total artists: ${processed}`)
  console.log(`   With Spotify artist genres: ${withSpotifyGenres}`)
  console.log(`   With track genres: ${withTrackGenres}`)
  console.log(`   Total tags added: ${totalGenresAdded}`)
  console.log(`   Average tags per artist: ${Math.round(Object.values(bios).reduce((sum, bio) => sum + bio.tags.length, 0) / processed)}`)
  console.log(`   File size: ${(fs.statSync(biosPath).size / 1024).toFixed(2)} KB`)

  // Show some examples
  console.log(`\n📝 Example consolidated tags:`)
  const examples = ['Bob Dylan', 'The Beatles', 'Aretha Franklin'].filter(name => bios[name])
  for (const name of examples.slice(0, 3)) {
    const bio = bios[name]
    console.log(`\n   ${name}:`)
    console.log(`     Last.fm tags: ${bio.lastfmTags.slice(0, 3).join(', ')}...`)
    console.log(`     Consolidated: ${bio.tags.slice(0, 5).join(', ')}${bio.tags.length > 5 ? '...' : ''}`)
    console.log(`     Sources: ${bio.tagSources.lastfm} Last.fm + ${bio.tagSources.spotifyArtist} Spotify artist + ${bio.tagSources.spotifyTracks} track genres`)
  }

  console.log(`\n✨ Done!\n`)
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
