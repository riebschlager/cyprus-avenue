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

import fs from 'fs'
import https from 'https'
import { URL } from 'url'
import path from 'path'
import readline from 'readline'

// Load .env file if it exists
function loadEnv() {
  let currentDir = process.cwd()
  let envPath = path.join(currentDir, '.env')

  if (!fs.existsSync(envPath)) {
    const parentDir = path.dirname(currentDir)
    const parentEnvPath = path.join(parentDir, '.env')
    if (fs.existsSync(parentEnvPath)) {
      envPath = parentEnvPath
    }
  }

  if (fs.existsSync(envPath)) {
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
    console.log(`✓ Loaded credentials from .env file\n`)
  }
}

loadEnv()

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ''
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ''
const RATE_LIMIT_DELAY = 350

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: Missing Spotify credentials')
  console.error('Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env file')
  process.exit(1)
}

// Helper: Make HTTPS request
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }

    const req = https.request(reqOptions, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data))
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', reject)
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

// Get Spotify access token
async function getAccessToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

  const response = await httpsRequest('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  return response.access_token
}

// Search Spotify with different strategies
async function searchSpotify(token, artist, song, strategy = 'default') {
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
    const response = await httpsRequest(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return response.tracks.items
  } catch (error) {
    console.error(`Search error: ${error.message}`)
    return []
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
  const notFoundPath = path.join(process.cwd(), 'data', 'spotify-not-found.json')
  const notFoundTracks = JSON.parse(fs.readFileSync(notFoundPath, 'utf-8'))

  console.log(`Found ${notFoundTracks.length} missing tracks\n`)

  // Load existing index
  const indexPath = path.join(process.cwd(), 'web', 'public', 'spotify-index.json')
  const existingIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))

  const token = await getAccessToken()
  console.log('✓ Authenticated with Spotify\n')

  const recovered = []
  const stillMissing = []
  let skipped = 0

  for (let i = 0; i < notFoundTracks.length; i++) {
    const track = notFoundTracks[i]
    console.log(`\n[${i + 1}/${notFoundTracks.length}] ${track.artist} - ${track.song}`)

    // Try multiple search strategies
    const strategies = ['default', 'simplified', 'artist-only', 'album', 'loose']
    let found = false

    for (const strategy of strategies) {
      if (found) break

      const results = await searchSpotify(token, track.artist, track.song, strategy)

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
          found = true
          break
        } else if (['1', '2', '3'].includes(answer)) {
          const selectedIndex = parseInt(answer) - 1
          if (results[selectedIndex]) {
            const selected = results[selectedIndex]
            const key = `${track.artist}|||${track.song}`

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

            existingIndex[key] = {
              url: selected.external_urls.spotify,
              confidence: 'medium', // Manual confirmation = medium confidence
              manual: true, // Mark as manually recovered to prevent re-indexing
              track_name: selected.name,
              artists: selected.artists.map(a => a.name)
            }

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

    if (!found && skipped === 0) {
      stillMissing.push(track)
    }
  }

  // Update source playlists if any corrections were requested
  const correctionsToApply = recovered.filter(r => r.updateSource && r.correctedData)
  let updatedPlaylists = 0
  let updatedTracks = 0

  if (correctionsToApply.length > 0) {
    console.log(`\n\n📝 Updating source playlists...`)

    // Load all playlists
    const playlistsPath = path.join(process.cwd(), 'json', 'playlists.json')
    const playlists = JSON.parse(fs.readFileSync(playlistsPath, 'utf-8'))

    // Apply corrections
    for (const correction of correctionsToApply) {
      for (const playlist of playlists) {
        let playlistUpdated = false
        for (const track of playlist.tracks) {
          if (track.artist === correction.original.artist &&
              track.song === correction.original.song) {
            track.artist = correction.correctedData.artist
            track.song = correction.correctedData.song
            playlistUpdated = true
            updatedTracks++
          }
        }
        if (playlistUpdated) {
          updatedPlaylists++
        }
      }
    }

    // Save updated playlists
    fs.writeFileSync(playlistsPath, JSON.stringify(playlists, null, 2))
    console.log(`   ✓ Updated ${updatedTracks} tracks across ${updatedPlaylists} playlists`)
  }

  // Save updated index
  fs.writeFileSync(indexPath, JSON.stringify(existingIndex, null, 2))
  console.log(`\n\n✅ Recovery complete!`)
  console.log(`   Recovered: ${recovered.length}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Still missing: ${stillMissing.length}`)
  if (correctionsToApply.length > 0) {
    console.log(`   Source corrections: ${correctionsToApply.length}`)
  }

  // Update spotify-not-found.json with remaining missing tracks
  if (stillMissing.length > 0) {
    fs.writeFileSync(notFoundPath, JSON.stringify(stillMissing, null, 2))
    console.log(`\n   Updated spotify-not-found.json with ${stillMissing.length} remaining tracks`)
  }

  // Save recovery report
  if (recovered.length > 0) {
    const reportPath = path.join(process.cwd(), 'data', 'spotify-recovery-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(recovered, null, 2))
    console.log(`   Saved recovery report to data/spotify-recovery-report.json`)
  }
}

// Run the recovery
recoverMissingTracks().catch(error => {
  console.error('\n❌ Error:', error.message)
  process.exit(1)
})
