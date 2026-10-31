const { sourcePath, readJSON, saveSnapshot, mergeLastfm } = require('../lib/source-data.cjs')
const fs = require('fs')
const path = require('path')

const { request, loadEnv } = require('../lib/maintenance.cjs')
loadEnv()

// Configuration
const LASTFM_API_KEY = process.env.LASTFM_API_KEY
const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/'
const RATE_LIMIT_DELAY = 1100 // 60 requests/minute = ~1 per second + buffer

if (!LASTFM_API_KEY) {
  console.error('❌ LASTFM_API_KEY environment variable is required')
  console.error('   Set it with: export LASTFM_API_KEY=your_api_key')
  process.exit(1)
}

// Read playlists to get unique artists
const playlistsPath = path.join(__dirname, '../../web/public/playlists.json')
const playlists = JSON.parse(fs.readFileSync(playlistsPath, 'utf-8'))

// Extract unique artist names
const artists = new Set()
playlists.forEach(playlist => {
  playlist.tracks.forEach(track => {
    if (track.artist) {
      artists.add(track.artist)
    }
  })
})

console.log(`\n📊 Found ${artists.size} unique artists to fetch\n`)

/**
 * Fetch artist bio from Last.fm API
 */
async function fetchArtistBio(artistName) {
  const params = new URLSearchParams({
    method: 'artist.getinfo',
    artist: artistName,
    api_key: LASTFM_API_KEY,
    format: 'json',
    autocorrect: 1  // Helps with spelling variations
  })

  try {
    const response = await request(`${LASTFM_BASE_URL}?${params}`)
    if (!response.ok) return { error: `HTTP ${response.status}` }
    const data = await response.json()

    if (data.error) {
      return { error: data.message }
    }

    if (!data.artist) {
      return { error: 'No artist data returned' }
    }

    const artist = data.artist

    // Clean up bio text (remove Last.fm footer links)
    const cleanBio = (text) => {
      if (!text) return ''
      // Remove the "Read more on Last.fm" footer that's in the API response
      return text.replace(/<a href="https:\/\/www\.last\.fm\/music\/[^"]+">Read more on Last\.fm<\/a>\.\s*/gi, '').trim()
    }

    // Robust image selection
    const getBestImage = (images) => {
      if (!images || !Array.isArray(images) || images.length === 0) return ''

      // Last.fm placeholder image hash (their default "no image" placeholder)
      const LASTFM_PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f'

      // Preferred order: large formats first
      const sizes = ['extralarge', 'large', 'mega', 'medium', 'small']
      for (const size of sizes) {
        const found = images.find(img => img.size === size && img['#text'])
        if (found) {
          const url = found['#text']
          // Reject Last.fm placeholder images
          if (url.includes(LASTFM_PLACEHOLDER_HASH)) {
            return ''
          }
          return url
        }
      }

      // Fallback: first one with content (but not placeholder)
      const any = images.find(img => {
        const url = img['#text']
        return url && !url.includes(LASTFM_PLACEHOLDER_HASH)
      })
      return any ? any['#text'] : ''
    }

    const imageUrl = getBestImage(artist.image)

    return {
      bio: cleanBio(artist.bio?.content || ''),
      bioSummary: cleanBio(artist.bio?.summary || ''),
      tags: artist.tags?.tag?.map(t => t.name).slice(0, 10) || [], // Limit to top 10 tags
      url: artist.url || '',
      image: imageUrl,
      listeners: parseInt(artist.stats?.listeners || 0),
      playcount: parseInt(artist.stats?.playcount || 0)
    }
  } catch (error) {
    return { error: error.message }
  }
}

/**
 * Main execution
 */
async function main() {
  const flags = process.argv.slice(2)
  if (flags.some(flag => !['--missing-only', '--refresh'].includes(flag)) ||
      (flags.includes('--missing-only') && flags.includes('--refresh'))) {
    throw new Error('Use --missing-only (default) or --refresh')
  }
  const refresh = flags.includes('--refresh')
  const outputPath = sourcePath('metadata', 'artist-bios.json')
  const bios = readJSON(outputPath)
  const artistList = Array.from(artists).sort()
  let processed = 0
  let found = 0
  let notFound = 0
  const errors = []

  console.log('⏳ Fetching artist bios from Last.fm...\n')
  console.log(`   Rate limit: ${Math.round(60000 / RATE_LIMIT_DELAY)} requests/minute\n`)

  for (const artist of artistList) {
    if (!refresh && bios[artist]?.bio) continue
    // Rate limiting: wait before each request
    if (processed > 0) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
    }

    const bio = await fetchArtistBio(artist)

    if (bio.error) {
      notFound++
      errors.push({ artist, error: bio.error })
      console.log(`  ✗ ${artist}: ${bio.error}`)
    } else {
      bios[artist] = mergeLastfm(bios[artist], bio)
      found++

      // Show progress with bio snippet
      const snippet = bio.bioSummary.substring(0, 60).replace(/\n/g, ' ')
      const imageStatus = bio.image ? '🖼️' : '⚠️ (no image - Last.fm API limitation)'
      console.log(`  ✓ ${artist} ${imageStatus}`)
      if (snippet) {
        console.log(`    "${snippet}..."`)
      }
    }

    processed++

    // Show progress every 50 artists
    if (processed % 50 === 0) {
      console.log(`\n  📈 Progress: ${processed}/${artistList.length} (${Math.round(processed / artistList.length * 100)}%)\n`)
    }
  }

  // Write to file
  saveSnapshot('artist-bios.json', bios)

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log(`✅ Artist bios saved to ${path.relative(process.cwd(), outputPath)}`)
  console.log(`${'='.repeat(60)}`)
  console.log(`📊 Statistics:`)
  console.log(`   Total artists: ${artistList.length}`)
  console.log(`   Found: ${found} (${Math.round(found / artistList.length * 100)}%)`)
  console.log(`   Not found: ${notFound} (${Math.round(notFound / artistList.length * 100)}%)`)
  console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`)

  if (errors.length > 0 && errors.length <= 20) {
    console.log(`\n⚠️  Artists not found on Last.fm:`)
    errors.forEach(({ artist, error }) => {
      console.log(`   - ${artist}: ${error}`)
    })
  } else if (errors.length > 20) {
    console.log(`\n⚠️  ${errors.length} artists not found (too many to list)`)
  }

  if (errors.length) process.exitCode = 1
  console.log(`\n✨ Done!\n`)
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
