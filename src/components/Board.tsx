import React from 'react';
import { PuzzleState } from '../core/puzzle';
import { CellPos } from '../core/types';

type Props = {
  state: PuzzleState;
  onToggle: (pos: CellPos) => void;
  regions?: number[][] | null;
};

type CellProps = {
  r: number;
  c: number;
  cell: string;
  onToggle: (pos: CellPos) => void;
  region?: number | null;
};

const Cell = React.memo(function Cell({ r, c, cell, onToggle, region }: CellProps) {
  const cls = cell === 'Queen' ? 'cell-queen' : cell === 'Cross' ? 'cell-cross' : 'cell-empty';
  const content = cell === 'Queen' ? '♕' : cell === 'Cross' ? '×' : region != null ? String(region % 10) : '';
  return (
    <div
      role="button"
      tabIndex={0}
      className={`board-cell ${cls}`}
      onClick={() => onToggle({ r, c })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onToggle({ r, c });
      }}
    >
      <div className="cell-content">{content}</div>
    </div>
  );
});

export default function Board({ state, onToggle, regions }: Props) {
  const n = state.cells.length;
  return (
    <div className="board-container">
      <div className="board-grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {state.cells.map((row, r) =>
          row.map((cell, c) => (
            <Cell
              key={`${r}-${c}`}
              r={r}
              c={c}
              cell={cell}
              onToggle={onToggle}
              region={regions ? regions[r][c] : null}
            />
          )),
        )}
      </div>
    </div>
  );
}
