# Tag consolidation

Run `npm run data:tags` from the repository root to merge retained Last.fm tags,
Spotify artist genres and indexed track genres without network access or credentials.
Run `npm run refresh:genres` separately to fetch and persist raw `spotifyGenres`.
Both commands update retained metadata and rebuild exports.

See [WORKFLOW.md](../WORKFLOW.md#tags-and-retained-inputs) for merge priority,
historical tag preservation, failures and setup, and [the source contract](../data/source/README.md)
for field ownership. The web app reads the resulting `tags` and `tagSources` fields.
