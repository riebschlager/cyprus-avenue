import type { Playlist, Track } from '../types/playlist'

/**
 * Download utilities for exporting playlists in various formats
 */

/**
 * Trigger a file download in the browser
 */
function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Convert playlist to CSV format
 */
function playlistToCSV(playlist: Playlist): string {
  const rows = [
    ['Artist', 'Song', 'Playlist', 'Date', 'Description']
  ]

  playlist.tracks.forEach(track => {
    rows.push([
      track.artist,
      track.song,
      playlist.title,
      playlist.date,
      playlist.description || ''
    ])
  })

  // Escape CSV fields that contain commas, quotes, or newlines
  return rows.map(row =>
    row.map(field => {
      const stringField = String(field)
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`
      }
      return stringField
    }).join(',')
  ).join('\n')
}

/**
 * Convert multiple playlists to CSV format
 */
function playlistsToCSV(playlists: Playlist[]): string {
  const rows = [
    ['Artist', 'Song', 'Playlist', 'Date', 'Description']
  ]

  playlists.forEach(playlist => {
    playlist.tracks.forEach(track => {
      rows.push([
        track.artist,
        track.song,
        playlist.title,
        playlist.date,
        playlist.description || ''
      ])
    })
  })

  return rows.map(row =>
    row.map(field => {
      const stringField = String(field)
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`
      }
      return stringField
    }).join(',')
  ).join('\n')
}

/**
 * Convert playlist to plain text format
 */
function playlistToText(playlist: Playlist): string {
  const lines = [
    playlist.title,
    playlist.date,
    ''
  ]

  if (playlist.description) {
    lines.push(playlist.description)
    lines.push('')
  }

  lines.push('Track List:')
  lines.push('')

  playlist.tracks.forEach((track, index) => {
    lines.push(`${index + 1}. ${track.artist} - ${track.song}`)
  })

  return lines.join('\n')
}

/**
 * Convert multiple playlists to plain text format
 */
function playlistsToText(playlists: Playlist[]): string {
  const sections: string[] = []

  playlists.forEach(playlist => {
    const lines = [
      '='.repeat(60),
      playlist.title,
      playlist.date,
      ''
    ]

    if (playlist.description) {
      lines.push(playlist.description)
      lines.push('')
    }

    lines.push('Track List:')
    lines.push('')

    playlist.tracks.forEach((track, index) => {
      lines.push(`${index + 1}. ${track.artist} - ${track.song}`)
    })

    sections.push(lines.join('\n'))
  })

  return sections.join('\n\n')
}

/**
 * Download a single playlist in the specified format
 */
export function downloadPlaylist(playlist: Playlist, format: 'csv' | 'json' | 'txt') {
  const safeName = playlist.date // Already in YYYY-MM-DD format

  switch (format) {
    case 'csv': {
      const content = playlistToCSV(playlist)
      triggerDownload(content, `cyprus-avenue-${safeName}.csv`, 'text/csv;charset=utf-8')
      break
    }
    case 'json': {
      const content = JSON.stringify(playlist, null, 2)
      triggerDownload(content, `cyprus-avenue-${safeName}.json`, 'application/json;charset=utf-8')
      break
    }
    case 'txt': {
      const content = playlistToText(playlist)
      triggerDownload(content, `cyprus-avenue-${safeName}.txt`, 'text/plain;charset=utf-8')
      break
    }
  }
}

/**
 * Download all playlists in the specified format
 */
export function downloadAllPlaylists(playlists: Playlist[], format: 'csv' | 'json' | 'txt') {
  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  switch (format) {
    case 'csv': {
      const content = playlistsToCSV(playlists)
      triggerDownload(content, `cyprus-avenue-complete-archive-${timestamp}.csv`, 'text/csv;charset=utf-8')
      break
    }
    case 'json': {
      const content = JSON.stringify(playlists, null, 2)
      triggerDownload(content, `cyprus-avenue-complete-archive-${timestamp}.json`, 'application/json;charset=utf-8')
      break
    }
    case 'txt': {
      const content = playlistsToText(playlists)
      triggerDownload(content, `cyprus-avenue-complete-archive-${timestamp}.txt`, 'text/plain;charset=utf-8')
      break
    }
  }
}
