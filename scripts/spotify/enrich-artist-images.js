const { sourcePath, saveSnapshot } = require('../lib/source-data.cjs')
const fs = require('fs')
const path = require('path')

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

// Configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const RATE_LIMIT_DELAY = 100 // Spotify allows ~10 requests/second
const TOKEN_REFRESH_INTERVAL = 3500000 // 58 minutes (tokens expire after 1 hour)

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('❌ SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables are required')
  console.error('   Add them to your .env file')
  process.exit(1)
}

let accessToken = null
let tokenExpiresAt = 0

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getAccessToken() {
  // Return cached token if still valid
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
      throw new Error(`Token request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    accessToken = data.access_token
    tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 min before expiry

    console.log('✓ Retrieved Spotify access token')
    return accessToken
  } catch (error) {
    throw new Error(`Failed to get Spotify access token: ${error.message}`)
  }
}

/**
 * Search for artist on Spotify and get their image
 */
async function getArtistImage(artistName, token) {
  try {
    const params = new URLSearchParams({
      q: artistName,
      type: 'artist',
      limit: 1
    })

    const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        throw new Error(`RATE_LIMIT:${retryAfter || 5}`)
      }
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

  const bios = JSON.parse(fs.readFileSync(biosPath, 'utf-8'))
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

  // Get access token
  const token = await getAccessToken()

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

    // Refresh token if needed
    if (Date.now() >= tokenExpiresAt) {
      await getAccessToken()
    }

    const result = await getArtistImage(artistName, token)

    if (result.error) {
      if (result.error.startsWith('RATE_LIMIT:')) {
        const retryAfter = parseInt(result.error.split(':')[1]) * 1000
        console.log(`  ⏸️  Rate limited, waiting ${retryAfter / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, retryAfter))
        // Retry
        const retryResult = await getArtistImage(artistName, token)
        if (retryResult.error) {
          notFound++
          errors.push({ artist: artistName, error: retryResult.error })
          console.log(`  ✗ ${artistName}: ${retryResult.error}`)
        } else {
          bios[artistName] = { ...bios[artistName], ...retryResult }
          imagesAdded++
          console.log(`  ✓ ${artistName} 🖼️ (${retryResult.popularity}/100 popularity)`)
        }
      } else {
        notFound++
        errors.push({ artist: artistName, error: result.error })
        console.log(`  ✗ ${artistName}: ${result.error}`)
      }
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

  console.log(`\n✨ Done!\n`)
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
