#!/usr/bin/env node

/**
 * Spotify Missing Track Recovery Tool
 *
 * This interactive script helps find Spotify matches for tracks that failed
 * in the initial indexing by using alternative search strategies:
 *
 * 1. Album search (when song name looks like album)
 * 2. Artist-only search (when duplicate artist/song)
 * 3. Simplified queries (removing featuring artists, special characters)
 * 4. Manual search with user confirmation
 *
 * Usage:
 *   node scripts/spotify/recover-missing-tracks.js
 */

const sourceData = require('../lib/source-data.cjs')
const { root, sourcePath, readJSON, writeJSON, rebuild } = sourceData
const path = require('path')
const readline = require('readline')

const { loadEnv } = require('../lib/maintenance.cjs')
loadEnv()

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ''
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ''
const RATE_LIMIT_DELAY = 350

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: Missing Spotify credentials')
  console.error('Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env file')
  process.exit(1)
}

const { createSpotifyClient } = require('../lib/maintenance.cjs')
const spotify = createSpotifyClient()
// Search Spotify with different strategies
async function searchSpotify(artist, song, strategy = 'default') {
  let query = ''

  switch (strategy) {
    case 'artist-only':
      // Just search by artist (useful when song=artist or song is album)
      query = `artist:${artist}`
      break

    case 'album':
      // Search for album by this artist
      query = `album:${song} artist:${artist}`
      break

    case 'simplified':
      // Remove featuring artists and special characters
      const simplifiedSong = song
        .replace(/\(with .+?\)/gi, '')
        .replace(/\(feat\.? .+?\)/gi, '')
        .replace(/[^\w\s]/g, ' ')
        .trim()
      query = `track:${simplifiedSong} artist:${artist}`
      break

    case 'loose':
      // Very loose search - just artist and song names
      query = `${artist} ${song}`
      break

    case 'default':
    default:
      query = `track:${song} artist:${artist}`
      break
  }

  const encodedQuery = encodeURIComponent(query)
  const url = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=5`

  try {
    const response = await spotify.json(url)
    return response.tracks.items
  } catch (error) {
    console.error(`Search error: ${error.message}`)
    throw error
  }
}

// Interactive CLI for user confirmation
function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

// Delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// Main recovery process
async function recoverMissingTracks() {
  console.log('🎵 Spotify Missing Track Recovery Tool\n')

  // Load missing tracks
  const notFoundPath = path.join(root, 'data', 'spotify-not-found.json')
  const notFoundTracks = readJSON(notFoundPath)

  console.log(`Found ${notFoundTracks.length} missing tracks\n`)

  // Load existing index
  const overridesPath = sourcePath('spotify-overrides.json')
  const overrides = readJSON(overridesPath)
  const correctionsPath = sourcePath('corrections.json')
  const corrections = readJSON(correctionsPath)

  console.log('✓ Authenticated with Spotify\n')

  const recovered = []
  const stillMissing = []
  let skipped = 0

  for (let i = 0; i < notFoundTracks.length; i++) {
    const track = notFoundTracks[i]
    if (overrides[`${track.artist}|${track.song}`]) continue
    console.log(`\n[${i + 1}/${notFoundTracks.length}] ${track.artist} - ${track.song}`)

    // Try multiple search strategies
    const strategies = ['default', 'simplified', 'artist-only', 'album', 'loose']
    let found = false
    let skipTrack = false

    for (const strategy of strategies) {
      if (found) break

      const results = await searchSpotify(track.artist, track.song, strategy)

      if (results.length > 0) {
        console.log(`\n  Strategy: ${strategy}`)
        console.log('  Results:')

        results.slice(0, 3).forEach((result, idx) => {
          const artists = result.artists.map(a => a.name).join(', ')
          console.log(`    ${idx + 1}. "${result.name}" by ${artists}`)
          console.log(`       Album: ${result.album.name}`)
          console.log(`       URL: ${result.external_urls.spotify}`)
        })

        const answer = await askUser('\n  Select (1-3), Skip (s), or Quit (q): ')

        if (answer === 'q') {
          console.log('\n⚠️  Quitting...')
          process.exit(0)
        } else if (answer === 's') {
          console.log('  ⏭️  Skipped')
          skipped++
          skipTrack = true
          found = true
          break
        } else if (['1', '2', '3'].includes(answer)) {
          const selectedIndex = parseInt(answer) - 1
          if (results[selectedIndex]) {
            const selected = results[selectedIndex]
            const key = `${track.artist}|${track.song}`

            // Check if data differs from original
            const spotifyArtist = selected.artists[0].name
            const spotifyTrack = selected.name
            const dataDiffers = track.artist !== spotifyArtist || track.song !== spotifyTrack

            let updateSource = false
            if (dataDiffers) {
              console.log('\n  ⚠️  Data mismatch detected:')
              console.log(`     Original:  "${track.artist}" - "${track.song}"`)
              console.log(`     Spotify:   "${spotifyArtist}" - "${spotifyTrack}"`)
              const updateAnswer = await askUser('  Update source playlists with Spotify data? (y/n): ')
              updateSource = updateAnswer === 'y' || updateAnswer === 'yes'
            }

            const mapping = {
              spotifyId: selected.id,
              spotifyUrl: selected.external_urls.spotify,
              previewUrl: selected.preview_url,
              albumArt: selected.album.images[0]?.url || null,
              confidence: 'medium', // Manual confirmation = medium confidence
              manual: true, // Mark as manually recovered to prevent re-indexing
              trackName: selected.name,
              artistName: selected.artists[0].name,
              artists: selected.artists.map(a => a.name)
            }

            if (updateSource) {
              corrections.push({ from: { artist: track.artist, song: track.song },
                to: { artist: spotifyArtist, song: spotifyTrack } })
            }
            // Keep both lookup keys when editorial spelling changes are approved.
            overrides[key] = mapping
            if (updateSource) overrides[`${spotifyArtist}|${spotifyTrack}`] = mapping
            // Persist each approval so quitting does not discard reviewed work.
            writeJSON(correctionsPath, corrections)
            writeJSON(overridesPath, overrides)
            rebuild()

            recovered.push({
              original: track,
              matched: selected,
              strategy,
              updateSource,
              correctedData: updateSource ? {
                artist: spotifyArtist,
                song: spotifyTrack
              } : null
            })

            console.log('  ✓ Added to index')
            found = true
          }
        }
      }

      await delay(RATE_LIMIT_DELAY)
    }

    if (!found || skipTrack) {
      stillMissing.push(track)
    }
  }

  const correctionsToApply = recovered.filter(r => r.updateSource)
  console.log(`\n\n✅ Recovery complete!`)
  console.log(`   Recovered: ${recovered.length}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Still missing: ${stillMissing.length}`)
  if (correctionsToApply.length > 0) {
    console.log(`   Source corrections: ${correctionsToApply.length}`)
  }

  // Update spotify-not-found.json with remaining missing tracks
  writeJSON(notFoundPath, stillMissing)
  console.log(`\n   Updated spotify-not-found.json with ${stillMissing.length} remaining tracks`)

  // Save recovery report
  if (recovered.length > 0) {
    const reportPath = path.join(root, 'data', 'spotify-recovery-report.json')
    writeJSON(reportPath, recovered)
    console.log(`   Saved recovery report to data/spotify-recovery-report.json`)
  }
}

// Run the recovery
recoverMissingTracks().catch(error => {
  console.error('\n❌ Error:', error.message)
  process.exit(1)
})
