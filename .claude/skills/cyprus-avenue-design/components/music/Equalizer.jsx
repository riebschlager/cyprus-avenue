import React from 'react';
export function Equalizer({ playing = true, color }) {
  return (
    <span className={'ca-eq' + (playing ? ' ca-eq--playing' : '')} aria-hidden="true">
      {[0,1,2,3].map(i => <span key={i} style={color ? { background: color } : null} />)}
    </span>
  );
}
