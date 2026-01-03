#!/usr/bin/env node

/**
 * Spotify Track Indexing Script
 *
 * This script indexes all tracks from the Cyprus Avenue archive with Spotify,
 * creating a mapping file for direct track links.
 *
 * Setup:
 * 1. Go to https://developer.spotify.com/dashboard
 * 2. Create an app (name: "Cyprus Avenue Archive")
 * 3. Get your Client ID and Client Secret
 * 4. Set environment variables or update the constants below
 *
 * Usage:
 *   SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/index-spotify-tracks.js
 */

import fs from 'fs'
import https from 'https'
import { URL } from 'url'
import path from 'path'

// Load .env file if it exists
function loadEnv() {
  // Try to find .env in the project root
  // Look in current directory first, then parent directories
  let currentDir = process.cwd()
  let envPath = path.join(currentDir, '.env')

  // If not found in cwd, check if we're in a subdirectory and look one level up
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
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue

      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=').trim()

      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '')

      // Only set if not already in environment
      if (key && !process.env[key]) {
        process.env[key] = cleanValue
      }
    }

    console.log(`✓ Loaded credentials from .env file (${envPath})\n`)
  }
}

// Load environment variables
loadEnv()

// Configuration
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ''
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ''
const RATE_LIMIT_DELAY = 350 // ms between requests (to stay under 100 req/30sec)

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: Missing Spotify credentials')
  console.error('')
  console.error('Please provide credentials in one of these ways:')
  console.error('')
  console.error('Option 1 - Create a .env file in the project root:')
  console.error('  SPOTIFY_CLIENT_ID=your_client_id')
  console.error('  SPOTIFY_CLIENT_SECRET=your_client_secret')
  console.error('')
  console.error('Option 2 - Set environment variables:')
  console.error('  SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/spotify/index-spotify-tracks.js')
  console.error('')
  console.error('Get credentials from: https://developer.spotify.com/dashboard')
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
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          resolve(data)
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

// Step 1: Get Spotify access token
async function getSpotifyToken() {
  console.log('🔑 Obtaining Spotify access token...')

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

  const data = await httpsRequest('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    },
    body: 'grant_type=client_credentials'
  })

  if (data.access_token) {
    console.log('✓ Token obtained successfully\n')
    return data.access_token
  } else {
    throw new Error('Failed to obtain access token: ' + JSON.stringify(data))
  }
}

// Cache for artist genres to avoid redundant API calls
const artistGenreCache = new Map()

// Helper: Get artist genres
async function getArtistGenres(token, artistId) {
  if (artistGenreCache.has(artistId)) {
    return artistGenreCache.get(artistId)
  }

  try {
    // slight delay to be safe with rate limits since this adds a call
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const data = await httpsRequest(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const genres = data.genres || []
    artistGenreCache.set(artistId, genres)
    return genres
  } catch (e) {
    // If it fails, just return empty array and don't cache (or cache empty?)
    // Let's return empty for now
    return []
  }
}

// Step 2: Search for a track on Spotify
async function searchSpotifyTrack(token, artist, song) {
  const query = encodeURIComponent(`track:"${song}" artist:"${artist}"`)
  const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=3`

  const data = await httpsRequest(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (data.tracks?.items?.length > 0) {
    // Get best match
    const track = data.tracks.items[0]
    const confidence = calculateConfidence(artist, song, track)
    
    // Fetch genres for the primary artist
    let genres = []
    if (track.artists && track.artists.length > 0 && track.artists[0].id) {
      genres = await getArtistGenres(token, track.artists[0].id)
    }

    return {
      spotifyId: track.id,
      spotifyUrl: track.external_urls.spotify,
      previewUrl: track.preview_url,
      albumArt: track.album.images[0]?.url || null,
      artistName: track.artists[0].name,
      trackName: track.name,
      genres: genres,
      confidence: confidence
    }
  }

  return null
}

// Step 3: Calculate match confidence
function calculateConfidence(originalArtist, originalSong, spotifyTrack) {
  const normalizeString = (str) => str.toLowerCase().trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')

  const origArtist = normalizeString(originalArtist)
  const origSong = normalizeString(originalSong)
  const spotArtist = normalizeString(spotifyTrack.artists[0].name)
  const spotSong = normalizeString(spotifyTrack.name)

  // Check for exact matches
  if (origArtist === spotArtist && origSong === spotSong) {
    return 'high'
  }

  // Check if artist name contains or is contained by original
  const artistMatch = origArtist.includes(spotArtist) ||
                      spotArtist.includes(origArtist) ||
                      origArtist.split(' ')[0] === spotArtist.split(' ')[0]

  // Check if song title contains or is contained by original
  const songMatch = origSong.includes(spotSong) ||
                    spotSong.includes(origSong) ||
                    origSong.split(' ')[0] === spotSong.split(' ')[0]

  if (artistMatch && songMatch) return 'high'
  if (artistMatch || songMatch) return 'medium'
  return 'low'
}

// Step 4: Index all unique tracks
async function indexAllTracks() {
  console.log('📀 Cyprus Avenue Spotify Track Indexer')
  console.log('=====================================\n')

  // Read playlists
  const playlistsPath = 'json/playlists.json'
  if (!fs.existsSync(playlistsPath)) {
    console.error(`❌ Error: ${playlistsPath} not found`)
    process.exit(1)
  }

  const playlists = JSON.parse(fs.readFileSync(playlistsPath, 'utf-8'))

  // Get unique tracks
  const uniqueTracks = new Map()
  for (const playlist of playlists) {
    for (const track of playlist.tracks) {
      const key = `${track.artist}|${track.song}`
      if (!uniqueTracks.has(key)) {
        uniqueTracks.set(key, track)
      }
    }
  }

  console.log(`Found ${uniqueTracks.size} unique tracks to index\n`)

  // Get Spotify token
  const token = await getSpotifyToken()

  // Load existing index to preserve manually-recovered tracks
  const outputPath = 'web/public/spotify-index.json'
  let trackIndex = {}
  let preservedCount = 0

  if (fs.existsSync(outputPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
      // Preserve tracks that were manually confirmed (medium confidence from recovery tool)
      for (const [key, value] of Object.entries(existing)) {
        if (value.confidence === 'medium' && value.manual === true) {
          trackIndex[key] = value
          preservedCount++
        }
      }
      if (preservedCount > 0) {
        console.log(`✓ Preserving ${preservedCount} manually-recovered tracks\n`)
      }
    } catch (err) {
      console.log('⚠ Could not load existing index, starting fresh\n')
    }
  }

  const notFoundTracks = []
  const stats = {
    total: uniqueTracks.size,
    found: 0,
    notFound: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    preserved: preservedCount
  }

  let processed = 0

  for (const [key, track] of uniqueTracks) {
    processed++
    const progress = `[${processed}/${stats.total}]`

    // Skip if already preserved from manual recovery
    if (trackIndex[key] && trackIndex[key].manual === true) {
      console.log(`${progress} ${track.artist} - ${track.song}... ⊙ (preserved)`)
      stats.found++
      stats.mediumConfidence++
      continue
    }

    process.stdout.write(`${progress} Searching: ${track.artist} - ${track.song}...`)

    try {
      const result = await searchSpotifyTrack(token, track.artist, track.song)

      if (result) {
        trackIndex[key] = result
        stats.found++
        stats[`${result.confidence}Confidence`]++
        console.log(` ✓ (${result.confidence})`)
      } else {
        stats.notFound++
        notFoundTracks.push({
          artist: track.artist,
          song: track.song
        })
        console.log(` ✗ (not found)`)
      }
    } catch (error) {
      console.log(` ⚠ (error: ${error.message})`)
      stats.notFound++
      notFoundTracks.push({
        artist: track.artist,
        song: track.song,
        error: error.message
      })
    }

    // Rate limiting
    if (processed < stats.total) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
    }
  }

  // Save index
  const outputPath = 'web/public/spotify-index.json'
  fs.mkdirSync('web/public', { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(trackIndex, null, 2))

  // Save not-found tracks
  const notFoundPath = 'data/spotify-not-found.json'
  fs.mkdirSync('data', { recursive: true })
  fs.writeFileSync(notFoundPath, JSON.stringify(notFoundTracks, null, 2))

  // Print summary
  console.log('\n=====================================')
  console.log('✨ Indexing Complete!')
  console.log('=====================================')
  console.log(`Total tracks:        ${stats.total}`)
  console.log(`Found on Spotify:    ${stats.found} (${(stats.found/stats.total*100).toFixed(1)}%)`)
  console.log(`Not found:           ${stats.notFound} (${(stats.notFound/stats.total*100).toFixed(1)}%)`)
  console.log('')
  console.log('Match Confidence:')
  console.log(`  High:              ${stats.highConfidence} (${(stats.highConfidence/stats.found*100).toFixed(1)}%)`)
  console.log(`  Medium:            ${stats.mediumConfidence} (${(stats.mediumConfidence/stats.found*100).toFixed(1)}%)`)
  console.log(`  Low:               ${stats.lowConfidence} (${(stats.lowConfidence/stats.found*100).toFixed(1)}%)`)
  console.log('')
  console.log(`Index saved to:      ${outputPath}`)
  console.log(`Index size:          ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`)
  console.log(`Not found saved to:  ${notFoundPath}`)
  console.log(`Not found count:     ${notFoundTracks.length} tracks`)
}

// Run the indexer
indexAllTracks().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})
