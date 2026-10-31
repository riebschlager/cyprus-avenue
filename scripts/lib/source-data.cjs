const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const root = path.resolve(__dirname, '../..')
const sourcePath = (...parts) => path.join(root, 'data/source', ...parts)
const readJSON = filename => JSON.parse(fs.readFileSync(filename, 'utf8'))
function writeJSON(filename, value) {
  const content = JSON.stringify(value, null, 2) + '\n'
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  const temporary = `${filename}.${process.pid}.tmp`
  try {
    fs.writeFileSync(temporary, content)
    fs.renameSync(temporary, filename)
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary)
  }
}
function rebuild() {
  execFileSync('python3', [path.join(root, 'scripts/parsing/parse_playlists.py')], { stdio: 'inherit' })
}
function saveSnapshot(filename, value) {
  writeJSON(sourcePath('metadata', filename), value)
  rebuild()
}
// Last.fm owns these fields. Shared display tags/images retain enriched values.
function mergeLastfm(previous = {}, incoming) {
  if (incoming.error) return previous
  const merged = { ...previous }
  for (const field of ['bio', 'bioSummary', 'url', 'listeners', 'playcount']) {
    const value = incoming[field]
    if (value !== undefined && value !== '' && value !== null) merged[field] = value
  }
  if (incoming.tags?.length) {
    merged.lastfmTags = incoming.tags
    if (!previous.tagSources) merged.tags = incoming.tags
  }
  if (incoming.image && !previous.spotifyId && !previous.image) merged.image = incoming.image
  return merged
}
module.exports = { root, sourcePath, readJSON, writeJSON, rebuild, saveSnapshot, mergeLastfm }
