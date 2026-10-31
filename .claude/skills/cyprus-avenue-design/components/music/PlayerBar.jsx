import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { IconButton, PlayButton } from '../core/IconButton.jsx';
import { Equalizer } from './Equalizer.jsx';

export function PlayerBar({ track, playing, progress = 0, connected = true, staticPos, onToggle, onPrev, onNext, onConnect, showTitle }) {
  return (
    <div className={'ca-player' + (staticPos ? ' ca-player--static' : '')} data-theme="dark">
      <div className="ca-player__progress"><span style={{ width: (progress * 100) + '%' }} /></div>
      <div className="ca-player__inner">
        <div className="ca-player__now">
          {track && track.art ? <img className="ca-player__art" src={track.art} alt="" /> : <span className="ca-player__art"><Icon name="disc-3" /></span>}
          <div className="ca-player__text">
            <span className="ca-player__title">{track ? track.song : 'Nothing playing'}</span>
            <span className="ca-player__artist">{track ? track.artist : 'Pick a track from any show'}</span>
          </div>
          {track && <Equalizer playing={playing} />}
        </div>
        <div className="ca-player__controls">
          <IconButton icon="skip-back" label="Previous track" className="ca-skip" onClick={onPrev} disabled={!track} />
          <PlayButton playing={playing} onClick={onToggle} disabled={!track} />
          <IconButton icon="skip-forward" label="Next track" className="ca-skip" onClick={onNext} disabled={!track} />
        </div>
        <div className="ca-player__right">
          {connected
            ? <span className="ca-player__source">{showTitle ? <>From <a href="#">{showTitle}</a> · </> : null}Spotify</span>
            : <button className="ca-btn ca-btn--sm ca-btn--secondary" style={{ color: 'var(--paper-50)', borderColor: '#423E38' }} onClick={onConnect}><Icon name="plug" />Connect Spotify</button>}
        </div>
      </div>
    </div>
  );
}
