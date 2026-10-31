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
 * 4. Set environment variables or the repository .env file
 *
 * Usage:
 *   SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/spotify/index-spotify-tracks.js
 */

const sourceData = require('../lib/source-data.cjs')
const { root, sourcePath, readJSON, writeJSON, saveSnapshot } = sourceData
const fs = require('fs')
const path = require('path')

const { loadEnv } = require('../lib/maintenance.cjs')
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

const { createSpotifyClient } = require('../lib/maintenance.cjs')
const spotify = createSpotifyClient()
// Cache for artist genres to avoid redundant API calls
const artistGenreCache = new Map()

// Helper: Get artist genres
async function getArtistGenres(artistId) {
  if (artistGenreCache.has(artistId)) {
    return artistGenreCache.get(artistId)
  }

  await new Promise(resolve => setTimeout(resolve, 100))
  const data = await spotify.json(`https://api.spotify.com/v1/artists/${artistId}`)
  if (!Array.isArray(data.genres) || !data.genres.every(genre => typeof genre === 'string')) {
    throw new Error('Invalid Spotify artist genres response')
  }
  artistGenreCache.set(artistId, data.genres)
  return data.genres
}

// Step 2: Search for a track on Spotify
async function searchSpotifyTrack(artist, song) {
  const query = encodeURIComponent(`track:"${song}" artist:"${artist}"`)
  const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=3`

  const data = await spotify.json(url)

  if (data.tracks?.items?.length > 0) {
    // Get best match
    const track = data.tracks.items[0]
    const confidence = calculateConfidence(artist, song, track)
    
    // Fetch genres for the primary artist
    let genres = []
    if (track.artists && track.artists.length > 0 && track.artists[0].id) {
      genres = await getArtistGenres(track.artists[0].id)
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
  const flags = process.argv.slice(2)
  if (flags.some(flag => !['--missing-only', '--refresh'].includes(flag)) ||
      (flags.includes('--missing-only') && flags.includes('--refresh'))) {
    throw new Error('Use --missing-only or --refresh (default)')
  }
  const missingOnly = flags.includes('--missing-only')

  console.log('📀 Cyprus Avenue Spotify Track Indexer')
  if (missingOnly) {
    console.log('🔍 Mode: Indexing only missing tracks')
  }
  console.log('=====================================\n')

  // Read playlists
  const playlistsPath = path.join(root, 'json/playlists.json')
  if (!fs.existsSync(playlistsPath)) {
    console.error(`❌ Error: ${playlistsPath} not found`)
    process.exit(1)
  }

  const playlists = readJSON(playlistsPath)

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

  console.log(`Found ${uniqueTracks.size} unique tracks total\n`)


  // Load existing index
  const outputPath = sourcePath('metadata', 'spotify-index.json')
  // Retain prior successes when an API refresh fails or finds no replacement.
  const trackIndex = readJSON(outputPath)
  const overrides = readJSON(sourcePath('spotify-overrides.json'))
  const preservedCount = Object.keys(trackIndex).length

  const notFoundTracks = []
  const stats = {
    total: uniqueTracks.size,
    found: 0,
    notFound: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    preserved: preservedCount,
    skipped: 0
  }

  let processed = 0
  const tracksToProcess = []
  
  // Filter unique tracks down to what we actually need to search
  for (const [key, track] of uniqueTracks) {
    if (overrides[key] || (missingOnly && trackIndex[key])) {
      stats.found++
      stats.skipped++
      // If we already have it, count its confidence for stats
      const existing = overrides[key] || trackIndex[key]
      if (existing.confidence) {
        stats[`${existing.confidence}Confidence`]++
      }
      continue
    }
    tracksToProcess.push({ key, track })
  }

  if (missingOnly) {
    console.log(`Skipping ${stats.skipped} already indexed tracks.`)
    console.log(`${tracksToProcess.length} tracks remaining to search.\n`)
  }

  for (const item of tracksToProcess) {
    const { key, track } = item
    processed++
    const progress = `[${processed}/${tracksToProcess.length}]`

    process.stdout.write(`${progress} Searching: ${track.artist} - ${track.song}...`)

    try {
      const result = await searchSpotifyTrack(track.artist, track.song)

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

  if (notFoundTracks.some(track => track.error)) process.exitCode = 1

  // Save index
  saveSnapshot('spotify-index.json', trackIndex)

  // Save not-found tracks
  const notFoundPath = path.join(root, 'data/spotify-not-found.json')
  fs.mkdirSync(path.join(root, 'data'), { recursive: true })
  writeJSON(notFoundPath, notFoundTracks)

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
