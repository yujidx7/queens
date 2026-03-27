import React, { useState } from 'react';

export default function NewGame(props: { startNew: (size: number) => void; back: () => void }) {
  const [size, setSize] = useState(8);
  return (
    <div>
      <h2>New Game</h2>
      <div>
        <label>Size: </label>
        <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
          {[5, 6, 7, 8, 9].map((s) => (
            <option key={s} value={s}>
              {s}x{s}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => props.startNew(size)}>Start</button>
        <button onClick={props.back}>Back</button>
      </div>
    </div>
  );
}
