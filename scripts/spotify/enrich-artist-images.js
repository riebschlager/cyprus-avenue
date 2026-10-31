const { sourcePath, readJSON, saveSnapshot } = require('../lib/source-data.cjs')
const fs = require('fs')

const { loadEnv } = require('../lib/maintenance.cjs')
loadEnv()

// Configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const RATE_LIMIT_DELAY = 100 // Spotify allows ~10 requests/second

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('❌ SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables are required')
  console.error('   Add them to your .env file')
  process.exit(1)
}

const { createSpotifyClient } = require('../lib/maintenance.cjs')
const spotify = createSpotifyClient()
/**
 * Search for artist on Spotify and get their image
 */
async function getArtistImage(artistName) {
  try {
    const params = new URLSearchParams({
      q: artistName,
      type: 'artist',
      limit: 1
    })

    const response = await spotify.request(`https://api.spotify.com/v1/search?${params}`)

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }

    const data = await response.json()

    if (!data.artists || !data.artists.items || data.artists.items.length === 0) {
      return { error: 'Not found on Spotify' }
    }

    const artist = data.artists.items[0]

    // Get the largest image available
    const images = artist.images || []
    const image = images.length > 0
      ? images.reduce((largest, img) =>
          (img.width > (largest?.width || 0)) ? img : largest
        )
      : null

    return {
      image: image?.url || '',
      spotifyId: artist.id,
      spotifyUrl: artist.external_urls?.spotify || '',
      popularity: artist.popularity || 0,
      followers: artist.followers?.total || 0
    }
  } catch (error) {
    return { error: error.message }
  }
}

/**
 * Main execution
 */
async function main() {
  // Read existing artist bios
  const biosPath = sourcePath('metadata', 'artist-bios.json')

  if (!fs.existsSync(biosPath)) {
    console.error('❌ artist-bios.json not found')
    console.error('   Run fetch-artist-bios.js first to create the base file')
    process.exit(1)
  }

  const bios = readJSON(biosPath)
  const artistNames = Object.keys(bios).sort()

  console.log(`\n📊 Found ${artistNames.length} artists in artist-bios.json\n`)

  // Count how many already have valid images (not Last.fm placeholders)
  const LASTFM_PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f'
  const withValidImages = artistNames.filter(name => {
    const img = bios[name].image || ''
    return img && !img.includes(LASTFM_PLACEHOLDER_HASH)
  }).length
  const needingImages = artistNames.length - withValidImages

  console.log(`   ${withValidImages} already have valid images`)
  console.log(`   ${needingImages} need images (will fetch from Spotify)\n`)


  let processed = 0
  let imagesAdded = 0
  let notFound = 0
  let errors = []

  console.log('⏳ Enriching artist data with Spotify images...\n')

  for (const artistName of artistNames) {
    // Last.fm placeholder hash to detect invalid images
    const LASTFM_PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f'
    const currentImage = bios[artistName].image || ''

    // Skip if already has a valid image (not empty and not Last.fm placeholder)
    if (currentImage && !currentImage.includes(LASTFM_PLACEHOLDER_HASH)) {
      console.log(`  ⏭️  ${artistName} (already has valid image)`)
      processed++
      continue
    }

    // Rate limiting
    if (processed > 0) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
    }


    const result = await getArtistImage(artistName)

    if (result.error) {
      notFound++
      errors.push({ artist: artistName, error: result.error })
      console.log(`  ✗ ${artistName}: ${result.error}`)
    } else {
      // Merge Spotify data with existing bio data
      bios[artistName] = { ...bios[artistName], ...result }
      imagesAdded++
      console.log(`  ✓ ${artistName} 🖼️ (${result.popularity}/100 popularity)`)
    }

    processed++

    // Show progress every 50 artists
    if (processed % 50 === 0) {
      console.log(`\n  📈 Progress: ${processed}/${artistNames.length} (${Math.round(processed / artistNames.length * 100)}%)\n`)
    }
  }

  // Write updated data back to file
  saveSnapshot('artist-bios.json', bios)

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log(`✅ Artist bios enriched with Spotify images`)
  console.log(`${'='.repeat(60)}`)
  // Calculate final coverage
  const finalWithImages = artistNames.filter(name => {
    const img = bios[name].image || ''
    return img && !img.includes(LASTFM_PLACEHOLDER_HASH)
  }).length

  console.log(`📊 Statistics:`)
  console.log(`   Total artists: ${artistNames.length}`)
  console.log(`   Already had valid images: ${withValidImages}`)
  console.log(`   New images added: ${imagesAdded}`)
  console.log(`   Not found on Spotify: ${notFound}`)
  console.log(`   Final coverage: ${finalWithImages}/${artistNames.length} (${Math.round((finalWithImages / artistNames.length) * 100)}%)`)
  console.log(`   File size: ${(fs.statSync(biosPath).size / 1024).toFixed(2)} KB`)

  if (errors.length > 0 && errors.length <= 20) {
    console.log(`\n⚠️  Artists not found on Spotify:`)
    errors.forEach(({ artist, error }) => {
      console.log(`   - ${artist}: ${error}`)
    })
  } else if (errors.length > 20) {
    console.log(`\n⚠️  ${errors.length} artists not found (too many to list)`)
  }

  if (errors.some(entry => entry.error !== 'Not found on Spotify')) process.exitCode = 1
  console.log(`\n✨ Done!\n`)
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
