const { sourcePath, readJSON, saveSnapshot } = require('../lib/source-data.cjs')
const { loadEnv, createSpotifyClient } = require('../lib/maintenance.cjs')
loadEnv()

async function main() {
  const spotify = createSpotifyClient()
  const bios = readJSON(sourcePath('metadata', 'artist-bios.json'))
  let failed = 0
  for (const [name, bio] of Object.entries(bios)) {
    if (!bio.spotifyId) continue
    try {
      const data = await spotify.json(`https://api.spotify.com/v1/artists/${encodeURIComponent(bio.spotifyId)}`)
      if (!Array.isArray(data.genres) || !data.genres.every(g => typeof g === 'string')) {
        throw new Error('Invalid artist genres response')
      }
      bio.spotifyGenres = data.genres
    } catch (error) {
      failed++
      console.error(`${name}: ${error.message}; retaining previous genres`)
    }
  }
  saveSnapshot('artist-bios.json', bios)
  if (failed) process.exitCode = 1
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
