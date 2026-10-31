// Runtime contract for JSON consumed by both the browser and MCP. Unknown provider
// fields survive validation; raw tags and biographies remain retained source data.
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const strings = value => Array.isArray(value) && value.every(item => typeof item === 'string')
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
const url = value => {
  if (value === '') return true
  if (typeof value !== 'string') return false
  try { return ['https:', 'http:'].includes(new URL(value).protocol) } catch { return false }
}
function assert(valid, path) {
  if (!valid) throw new Error(`Invalid archive data: ${path}`)
}
function fields(value, names, check, path, optional = false) {
  for (const name of names) {
    assert(optional && value[name] === undefined || check(value[name]), `${path}.${name}`)
  }
}
function index(value, validate, name) {
  assert(record(value), name)
  for (const [key, entry] of Object.entries(value)) {
    assert(record(entry), `${name}[${key}]`)
    validate(entry, `${name}[${key}]`)
  }
  return value
}
export function parsePlaylists(value) {
  assert(Array.isArray(value), 'playlists')
  const dates = new Set()
  for (const [i, playlist] of value.entries()) {
    const path = `playlists[${i}]`
    assert(record(playlist), path)
    fields(playlist, ['date', 'archived_date'], date, path)
    fields(playlist, ['title', 'description'], v => typeof v === 'string', path)
    fields(playlist, ['source_url'], url, path)
    assert(!dates.has(playlist.date), `${path}.date (duplicate)`)
    dates.add(playlist.date)
    assert(Array.isArray(playlist.tracks), `${path}.tracks`)
    for (const [j, track] of playlist.tracks.entries()) {
      const trackPath = `${path}.tracks[${j}]`
      assert(record(track), trackPath)
      fields(track, ['artist', 'song'], v => typeof v === 'string', trackPath)
      fields(track, ['genres'], strings, trackPath, true)
    }
  }
  return value
}
export function parseArtistBios(value) {
  return index(value, (bio, path) => {
    fields(bio, ['bio', 'bioSummary', 'spotifyId'], v => typeof v === 'string', path, true)
    fields(bio, ['url', 'image', 'spotifyUrl'], url, path, true)
    fields(bio, ['tags', 'lastfmTags', 'genres', 'spotifyGenres'], strings, path, true)
    fields(bio, ['listeners', 'playcount', 'popularity', 'followers'], v => typeof v === 'number' && Number.isFinite(v) && v >= 0, path, true)
    for (const name of ['tagSources', 'genreSources']) {
      if (bio[name] === undefined) continue
      assert(record(bio[name]), `${path}.${name}`)
      fields(bio[name], ['lastfm', 'spotifyArtist', 'spotifyTracks', 'total'], v => Number.isInteger(v) && v >= 0, `${path}.${name}`, true)
    }
  }, 'artist-bios')
}
export function parseSpotifyIndex(value) {
  return index(value, (track, path) => {
    fields(track, ['spotifyId', 'artistName', 'trackName'], v => typeof v === 'string', path)
    fields(track, ['spotifyUrl'], url, path)
    fields(track, ['albumArt', 'previewUrl'], v => v === null || url(v), path, true)
    fields(track, ['genres'], strings, path, true)
    assert(['high', 'medium', 'low'].includes(track.confidence), `${path}.confidence`)
  }, 'spotify-index')
}
