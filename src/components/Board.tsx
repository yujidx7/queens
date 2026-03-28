import React, { useRef } from 'react';
import { PuzzleState } from '../core/puzzle';
import { CellPos } from '../core/types';

type Props = {
  state: PuzzleState;
  onToggle: (pos: CellPos) => void;
  regions?: number[][] | null;
  onSetCell?: (pos: CellPos, value: 'Empty' | 'Cross' | 'Queen') => void;
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
  const content = cell === 'Queen' ? '♕' : cell === 'Cross' ? '×' : '';
  // region color via HSL based on region id
  const style: React.CSSProperties = {};
  if (region != null) {
    const hue = Math.round((region * 360) / Math.max(1, 12));
    // stronger saturation and clearer contrast for human distinction
    const saturation = 80; // percent
    const baseLight = 68; // slightly darker to make colors pop
    style.background = `hsl(${hue} ${saturation}% ${baseLight}%)`;
    // choose text color for legibility
    const lightNum = baseLight;
    style.color = lightNum < 60 ? '#fff' : '#111';
    // slightly darker border to keep cell separation visible
    style.border = `1px solid hsl(${hue} ${Math.max(10, saturation - 60)}% ${Math.max(20, baseLight - 40)}%)`;
  }
  return (
    <div role="button" tabIndex={0} className={`board-cell ${cls}`} style={style}>
      <div className="cell-content">{content}</div>
    </div>
  );
});

export default function Board({ state, onToggle, regions, onSetCell }: Props) {
  const n = state.cells.length;
  // compute violations: mark queens that conflict (same column, adjacency, same region)
  const violSet = new Set<string>();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (state.cells[r][c] !== 'Queen') continue;
      // check same column
      for (let rr = 0; rr < n; rr++) {
        if (rr === r) continue;
        if (state.cells[rr][c] === 'Queen') {
          violSet.add(`${r}-${c}`);
          violSet.add(`${rr}-${c}`);
        }
      }
      // adjacency
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr,
            cc = c + dc;
          if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
          if (state.cells[rr][cc] === 'Queen') {
            violSet.add(`${r}-${c}`);
            violSet.add(`${rr}-${cc}`);
          }
        }
      // same region
      if (regions) {
        const rid = regions[r][c];
        for (let rr = 0; rr < n; rr++)
          for (let cc = 0; cc < n; cc++) {
            if (rr === r && cc === c) continue;
            if (regions[rr][cc] === rid && state.cells[rr][cc] === 'Queen') {
              violSet.add(`${r}-${c}`);
              violSet.add(`${rr}-${cc}`);
            }
          }
      }
    }
  }

  // also check same row (horizontal queens)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (state.cells[r][c] !== 'Queen') continue;
      for (let cc = 0; cc < n; cc++) {
        if (cc === c) continue;
        if (state.cells[r][cc] === 'Queen') {
          violSet.add(`${r}-${c}`);
          violSet.add(`${r}-${cc}`);
        }
      }
    }
  }

  // Drag/slide handling at grid level using pointer coordinates (works reliably for mouse and touch)
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    mode: 'place' | 'remove' | null;
    pointerId?: number;
    moved?: boolean;
    startPos?: { r: number; c: number } | null;
    startValue?: string | null;
    lastPos?: { r: number; c: number } | null;
  }>({ active: false, mode: null, moved: false, startPos: null, startValue: null, lastPos: null });

  function clientToCell(clientX: number, clientY: number) {
    const el = gridRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) return null;
    const cellW = rect.width / n;
    const cellH = rect.height / n;
    const c = Math.min(n - 1, Math.floor(relX / cellW));
    const r = Math.min(n - 1, Math.floor(relY / cellH));
    return { r, c };
  }

  function onGridPointerDown(e: React.PointerEvent) {
    const pos = clientToCell(e.clientX, e.clientY);
    if (!pos) return;
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {}
    dragRef.current.active = true;
    dragRef.current.pointerId = e.pointerId;
    dragRef.current.moved = false;
    dragRef.current.startPos = pos;
    dragRef.current.lastPos = pos;
    dragRef.current.startValue = state.cells[pos.r][pos.c];
    dragRef.current.mode = null; // will set on move based on startValue
  }

  function onGridPointerMove(e: React.PointerEvent) {
    if (!dragRef.current.active) return;
    const pos = clientToCell(e.clientX, e.clientY);
    if (!pos) return;
    const last = dragRef.current.lastPos;
    if (last && last.r === pos.r && last.c === pos.c) return;
    dragRef.current.moved = true;
    dragRef.current.lastPos = pos;
    const startVal = dragRef.current.startValue;
    if (dragRef.current.mode == null) {
      if (startVal === 'Cross') dragRef.current.mode = 'remove';
      else if (startVal === 'Empty') dragRef.current.mode = 'place';
      else dragRef.current.mode = null;
    }
    const cell = state.cells[pos.r][pos.c];
    if (cell === 'Queen') return;
    if (dragRef.current.mode === 'place') {
      if (onSetCell) onSetCell(pos, 'Cross');
      else if (state.cells[pos.r][pos.c] !== 'Cross') onToggle(pos);
    } else if (dragRef.current.mode === 'remove') {
      if (onSetCell) onSetCell(pos, 'Empty');
      else if (state.cells[pos.r][pos.c] === 'Cross') onToggle(pos);
    }
  }

  function onGridPointerUp(e: React.PointerEvent) {
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {}
    const wasMoved = !!dragRef.current.moved;
    const start = dragRef.current.startPos;
    if (!wasMoved && start) {
      onToggle(start);
    }
    dragRef.current.active = false;
    dragRef.current.mode = null;
    dragRef.current.pointerId = undefined;
    dragRef.current.moved = false;
    dragRef.current.startPos = null;
    dragRef.current.startValue = null;
    dragRef.current.lastPos = null;
  }

  return (
    <div className="board-container">
      <div
        ref={gridRef}
        className="board-grid"
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
        onPointerDown={onGridPointerDown}
        onPointerMove={onGridPointerMove}
        onPointerUp={onGridPointerUp}
      >
        {state.cells.map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} style={{ position: 'relative' }}>
              <Cell
                r={r}
                c={c}
                cell={cell}
                onToggle={onToggle}
                region={regions ? regions[r][c] : null}
              />
              {violSet.has(`${r}-${c}`) && state.cells[r][c] === 'Queen' ? (
                <div className="violation-overlay" title="Rule violation" />
              ) : null}
            </div>
          )),
        )}
      </div>
    </div>
  );
}
