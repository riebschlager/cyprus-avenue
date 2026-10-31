import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { IconButton } from '../core/IconButton.jsx';
import { Badge } from '../core/Tag.jsx';
import { Equalizer } from './Equalizer.jsx';
import { StreamingLinks } from './StreamingLinks.jsx';
const cx = (...a) => a.filter(Boolean).join(' ');

export function TrackRow({ index, song, artist, show, meta, playing, paused, highlight, unavailable, onPlay, onArtist, onCopyLink }) {
  return (
    <li className={cx('ca-track', playing && 'ca-track--playing', highlight && 'ca-track--highlight', unavailable && 'ca-track--unavailable')}>
      <span className="ca-track__num">
        {playing ? <Equalizer playing={!paused} /> : <span className="ca-track__n">{String(index).padStart(2, '0')}</span>}
        {!playing && !unavailable && <button className="ca-track__playicon" aria-label={'Play ' + song} onClick={onPlay}><Icon name="play" style={{ marginLeft: 1 }} /></button>}
      </span>
      <div className="ca-track__main">
        <span className="ca-track__title">{song}</span>
        <a className="ca-track__artist" href="#" onClick={e => { e.preventDefault(); onArtist && onArtist(artist); }}>{artist}</a>
        {show !== undefined && <span className="ca-track__meta">{show}</span>}
        {meta !== undefined && <span className="ca-track__meta">{meta}</span>}
      </div>
      <div className="ca-track__actions">
        {unavailable && <Badge tone="outline">Not on Spotify</Badge>}
        <IconButton icon="link" label="Copy link to track" size="sm" reveal onClick={onCopyLink} />
        <StreamingLinks artist={artist} song={song} reveal />
      </div>
    </li>
  );
}

export function TrackList({ tracks, wide, columns, playingIndex, paused, highlightIndex, onPlay, onArtist, onCopyLink }) {
  return (
    <div>
      {wide && columns && (
        <div className="ca-tracklist__head">
          {['#'].concat(columns).map((c, i) => <span key={i} className="ca-label ca-label--sm">{c}</span>)}
        </div>
      )}
      <ol className={cx('ca-tracklist', wide && 'ca-tracklist--wide')}>
        {tracks.map((t, i) => (
          <TrackRow key={i} index={i + 1} {...t} playing={playingIndex === i} paused={paused} highlight={highlightIndex === i}
            onPlay={() => onPlay && onPlay(i, t)} onArtist={onArtist} onCopyLink={() => onCopyLink && onCopyLink(i, t)} />
        ))}
      </ol>
    </div>
  );
}
