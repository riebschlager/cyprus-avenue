import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { loadArchiveData } from '../dist/data/loader.js'
import { discoverByTag } from '../dist/tools/discovery.js'
import { normalizeTags } from '../../shared/tagFilters.mjs'

test('tag discovery agrees with browser normalization for all retained artist tags', () => {
  const data = loadArchiveData()
  const expected = new Map()
  for (const [artist, bio] of Object.entries(data.artistBios)) {
    for (const tag of normalizeTags(bio.tags || [])) {
      const key = tag.toLowerCase()
      if (!expected.has(key)) expected.set(key, new Set())
      expected.get(key).add(artist)
    }
  }
  assert.deepEqual(new Set(data.allTags), new Set(expected.keys()))
  for (const [tag, artists] of expected) {
    const result = discoverByTag(data, { tags: [tag], limit: 1000 })
    assert.deepEqual(new Set(result.artists.map(a => a.name)), artists, tag)
    assert.deepEqual(data.tagToArtists.get(tag), artists, tag)
  }
  assert.equal(discoverByTag(data, { tags: ['Seen Live'], matchAll: true }).totalArtists, 0)
  assert.deepEqual(discoverByTag(data, { tags: ['rnb'], limit: 1000 }).artists,
    discoverByTag(data, { tags: ['R&B'], limit: 1000 }).artists)
})

test('built MCP server starts over stdio, lists tools, and serves an archive query', { timeout: 15000 }, async () => {
  const transport = new StdioClientTransport({ command: process.execPath, args: ['dist/index.js'], stderr: 'pipe' })
  const client = new Client({ name: 'archive-regression', version: '1.0.0' })
  try {
    await client.connect(transport)
    const tools = await client.listTools()
    assert.equal(tools.tools.length, 21)
    assert.ok(tools.tools.some(tool => tool.name === 'get_playlist'))
    const result = await client.callTool({ name: 'get_playlist', arguments: { date: '2013-06-22' } })
    assert.ok(!result.isError)
    assert.match(JSON.stringify(result.content), /2013-06-22/)
  } finally {
    await client.close()
  }
})
