const fs = require('fs')
const path = require('path')

/**
 * Consolidate genre/tag information from multiple sources:
 * 1. Last.fm tags (already in artist-bios.json)
 * 2. Spotify track genres (from spotify-index.json)
 * 3. Spotify artist genres (fetch from Spotify API)
 *
 * Creates a unified "genres" field that merges all sources.
 */

// Load .env file if it exists
function loadEnv() {
  const currentDir = process.cwd()
  let envPath = path.join(currentDir, '.env')

  if (!fs.existsSync(envPath)) {
    const parentDir = path.dirname(currentDir)
    const parentEnvPath = path.join(parentDir, '.env')
    if (fs.existsSync(parentEnvPath)) {
      envPath = parentEnvPath
    }
  }

  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      const lines = envContent.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim()
        const cleanValue = value.replace(/^["']|["']$/g, '')

        if (key && !process.env[key]) {
          process.env[key] = cleanValue
        }
      }
      console.log(`✓ Loaded credentials from .env file (${envPath})`)
    } catch (err) {
      console.warn(`⚠ Error reading .env file: ${err.message}`)
    }
  }
}

loadEnv()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('❌ SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables are required')
  process.exit(1)
}

let accessToken = null
let tokenExpiresAt = 0

/**
 * Get Spotify access token
 */
async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken
  }

  const authString = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`)
    }

    const data = await response.json()
    accessToken = data.access_token
    tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000

    console.log('✓ Retrieved Spotify access token')
    return accessToken
  } catch (error) {
    throw new Error(`Failed to get Spotify access token: ${error.message}`)
  }
}

/**
 * Get artist genres from Spotify
 */
async function getArtistGenres(spotifyId, token) {
  if (!spotifyId) return []

  try {
    const response = await fetch(`https://api.spotify.com/v1/artists/${spotifyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.genres || []
  } catch (error) {
    return []
  }
}

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
  const biosPath = path.join(__dirname, '../web/public/artist-bios.json')
  const indexPath = path.join(__dirname, '../web/public/spotify-index.json')

  if (!fs.existsSync(biosPath)) {
    console.error('❌ artist-bios.json not found')
    process.exit(1)
  }

  if (!fs.existsSync(indexPath)) {
    console.error('❌ spotify-index.json not found')
    process.exit(1)
  }

  const bios = JSON.parse(fs.readFileSync(biosPath, 'utf-8'))
  const trackIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

  console.log(`📊 Loaded ${Object.keys(bios).length} artists from artist-bios.json`)
  console.log(`📊 Loaded ${Object.keys(trackIndex).length} tracks from spotify-index.json\n`)

  // Extract track genres by artist
  console.log('⏳ Extracting genres from track index...')
  const trackGenresByArtist = extractTrackGenresByArtist(trackIndex)
  console.log(`✓ Found track genres for ${Object.keys(trackGenresByArtist).length} artists\n`)

  // Get Spotify access token
  const token = await getAccessToken()

  let processed = 0
  let withSpotifyGenres = 0
  let withTrackGenres = 0
  let totalGenresAdded = 0

  console.log('⏳ Consolidating genres for each artist...\n')

  for (const [artistName, bio] of Object.entries(bios)) {
    const lastfmTags = bio.tags || []
    const spotifyId = bio.spotifyId
    const trackGenres = trackGenresByArtist[artistName] || []

    // Get Spotify artist genres if we have an ID
    let spotifyArtistGenres = []
    if (spotifyId) {
      spotifyArtistGenres = await getArtistGenres(spotifyId, token)

      if (spotifyArtistGenres.length > 0) {
        withSpotifyGenres++
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    if (trackGenres.length > 0) {
      withTrackGenres++
    }

    // Merge all genre sources
    const mergedGenres = mergeGenres(lastfmTags, spotifyArtistGenres, trackGenres)
    const genresAdded = mergedGenres.length - lastfmTags.length

    // Update bio with consolidated genres
    bio.genres = mergedGenres

    // Keep original tags for reference
    // bio.tags stays as is (Last.fm tags)

    // Add source info for transparency
    bio.genreSources = {
      lastfm: lastfmTags.length,
      spotifyArtist: spotifyArtistGenres.length,
      spotifyTracks: trackGenres.length,
      total: mergedGenres.length
    }

    if (genresAdded > 0) {
      totalGenresAdded += genresAdded
      console.log(`  ✓ ${artistName}: ${lastfmTags.length} → ${mergedGenres.length} genres (+${genresAdded})`)
    } else {
      console.log(`  ⏭️  ${artistName}: ${mergedGenres.length} genres (no additions)`)
    }

    processed++

    // Show progress every 50 artists
    if (processed % 50 === 0) {
      console.log(`\n  📈 Progress: ${processed}/${Object.keys(bios).length} (${Math.round(processed / Object.keys(bios).length * 100)}%)\n`)
    }
  }

  // Write updated data
  fs.writeFileSync(biosPath, JSON.stringify(bios, null, 2))

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log(`✅ Genre consolidation complete`)
  console.log(`${'='.repeat(60)}`)
  console.log(`📊 Statistics:`)
  console.log(`   Total artists: ${processed}`)
  console.log(`   With Spotify artist genres: ${withSpotifyGenres}`)
  console.log(`   With track genres: ${withTrackGenres}`)
  console.log(`   Total genres added: ${totalGenresAdded}`)
  console.log(`   Average genres per artist: ${Math.round(Object.values(bios).reduce((sum, bio) => sum + bio.genres.length, 0) / processed)}`)
  console.log(`   File size: ${(fs.statSync(biosPath).size / 1024).toFixed(2)} KB`)

  // Show some examples
  console.log(`\n📝 Example consolidated genres:`)
  const examples = ['Bob Dylan', 'The Beatles', 'Aretha Franklin'].filter(name => bios[name])
  for (const name of examples.slice(0, 3)) {
    const bio = bios[name]
    console.log(`\n   ${name}:`)
    console.log(`     Last.fm tags: ${bio.tags.slice(0, 3).join(', ')}...`)
    console.log(`     Consolidated: ${bio.genres.slice(0, 5).join(', ')}${bio.genres.length > 5 ? '...' : ''}`)
    console.log(`     Sources: ${bio.genreSources.lastfm} Last.fm + ${bio.genreSources.spotifyArtist} Spotify artist + ${bio.genreSources.spotifyTracks} track genres`)
  }

  console.log(`\n✨ Done!\n`)
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
