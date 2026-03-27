import React from 'react';

export default function Home(props: {
  onNew: () => void;
  onContinue: () => void;
  onClear: () => void;
  hasSaved: boolean;
  goToNewGame: () => void;
}) {
  return (
    <div>
      <h2>Home</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={props.onNew}>Quick New</button>
        <button onClick={props.goToNewGame}>New (options)</button>
        <button onClick={props.onContinue} disabled={!props.hasSaved}>
          Continue
        </button>
        <button onClick={props.onClear} disabled={!props.hasSaved}>
          Clear Save
        </button>
      </div>
    </div>
  );
}
