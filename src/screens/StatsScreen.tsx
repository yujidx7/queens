import React from 'react';

export default function StatsScreen(props: { stats: any; clear: () => void; back: () => void }) {
  return (
    <div>
      <h2>Stats</h2>
      <pre>{JSON.stringify(props.stats, null, 2)}</pre>
      <div style={{ marginTop: 8 }}>
        <button onClick={props.clear}>Clear</button>
        <button onClick={props.back}>Close</button>
      </div>
    </div>
  );
}
