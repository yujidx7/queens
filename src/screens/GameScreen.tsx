import React from 'react';
import Board from '../components/Board';
import { PuzzleDefinition, PuzzleState } from '../core/puzzle';

export default function GameScreen(props: {
  puzzle: PuzzleDefinition;
  state: PuzzleState;
  onToggle: (pos: { r: number; c: number }) => void;
  undo: () => void;
  redo: () => void;
  restart: () => void;
  openSettings: () => void;
  openStats: () => void;
  share: () => void;
  hintText?: string | null;
}) {
  return (
    <div>
      <h2>Game</h2>
      <div>Difficulty: {props.puzzle.difficulty?.label}</div>
      <Board state={props.state} onToggle={props.onToggle} regions={props.puzzle.regions} />
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={props.undo}>Undo</button>
        <button onClick={props.redo}>Redo</button>
        <button onClick={props.restart}>Restart</button>
        <button onClick={props.openSettings}>Settings</button>
        <button onClick={props.openStats}>Stats</button>
        <button onClick={props.share}>Share</button>
        <button
          onClick={() => {
            if (props.hintText) alert(props.hintText);
          }}
        >
          Hint
        </button>
      </div>
    </div>
  );
}
