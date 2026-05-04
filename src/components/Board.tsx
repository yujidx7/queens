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
    // Use a palette with explicit H/S/L to ensure visual distinctness.
    // Only one green hue (140) is included. Avoid gray/desaturated colors.
    const palette = [
      { h: 0, s: 78, l: 60 },   // red
      { h: 30, s: 78, l: 60 },  // orange
      { h: 60, s: 78, l: 60 },  // yellow
      { h: 140, s: 76, l: 60 }, // green (single green)
      { h: 190, s: 78, l: 60 }, // teal
      { h: 220, s: 78, l: 60 }, // blue
      { h: 260, s: 78, l: 60 }, // indigo
      { h: 300, s: 78, l: 60 }, // magenta
    ];
    const { h, s, l } = palette[region % palette.length];
    style.background = `hsl(${h} ${s}% ${l}%)`;
    // choose text color for legibility (black on light backgrounds, white on dark)
    style.color = l < 60 ? '#fff' : '#111';
    // slightly darker border to keep cell separation visible
    const borderSat = Math.max(10, s - 40);
    const borderLight = Math.max(18, l - 18);
    style.border = `1px solid hsl(${h} ${borderSat}% ${borderLight}%)`;
  }
  return (
    <div
      role="button"
      tabIndex={0}
      className={`board-cell ${cls}`}
      style={style}
      onClick={() => onToggle({ r, c })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle({ r, c });
        }
      }}
    >
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
  const ignoreClickRef = useRef(false);
  const dragRef = useRef<{
    active: boolean;
    mode: 'place' | 'remove' | null;
    pointerId?: number;
    moved?: boolean;
    startPos?: { r: number; c: number } | null;
    startValue?: string | null;
    lastPos?: { r: number; c: number } | null;
  }>({ active: false, mode: null, moved: false, startPos: null, startValue: null, lastPos: null });

  // dragRef enhancements for long-press/tap behavior
  // longPress is triggered if press duration >= 0.33s (330ms) or user moves to another cell while pressing
  const longRef = useRef<{
    active: boolean;
    pointerId?: number;
    moved?: boolean;
    startPos?: { r: number; c: number } | null;
    startValue?: string | null;
    lastPos?: { r: number; c: number } | null;
    longPress: boolean;
    timerId?: number | null;
    touched: Set<string>;
    applied: Set<string>;
  }>({ active: false, moved: false, startPos: null, startValue: null, lastPos: null, longPress: false, timerId: null, touched: new Set() });

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

  // Helper: set a cell to a specific target value. Prefer onSetCell if provided.
  function setCellTo(pos: { r: number; c: number }, target: 'Empty' | 'Cross' | 'Queen') {
    if (onSetCell) {
      onSetCell(pos, target);
      return;
    }
    // fallback: use onToggle to cycle until we reach target (best-effort)
    const order: Array<'Empty' | 'Cross' | 'Queen'> = ['Empty', 'Cross', 'Queen'];
    let cur = state.cells[pos.r][pos.c] as 'Empty' | 'Cross' | 'Queen';
    let attempts = 0;
    while (cur !== target && attempts < 3) {
      onToggle(pos);
      const idx = order.indexOf(cur);
      cur = order[(idx + 1) % order.length];
      attempts++;
    }
  }

  function cycleCellOnce(pos: { r: number; c: number }) {
    if (onSetCell) {
      const cur = state.cells[pos.r][pos.c];
      if (cur === 'Empty') onSetCell(pos, 'Cross');
      else if (cur === 'Cross') onSetCell(pos, 'Queen');
      else onSetCell(pos, 'Empty');
    } else {
      onToggle(pos);
    }
  }
  function onGridPointerDown(e: React.PointerEvent) {
    const pos = clientToCell(e.clientX, e.clientY);
    if (!pos) return;
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {}
    longRef.current.active = true;
    longRef.current.pointerId = e.pointerId;
    longRef.current.moved = false;
    longRef.current.startPos = pos;
    longRef.current.lastPos = pos;
    longRef.current.startValue = state.cells[pos.r][pos.c];
    longRef.current.longPress = false;
    longRef.current.touched = new Set([`${pos.r}-${pos.c}`]);
    longRef.current.applied = new Set();

    // start timer for long press (0.33s / 330ms)
    if (longRef.current.timerId) {
      window.clearTimeout(longRef.current.timerId);
      longRef.current.timerId = null;
    }
    longRef.current.timerId = window.setTimeout(() => {
      longRef.current.longPress = true;
      longRef.current.timerId = null;
      // apply to start cell immediately when long press triggers
      const start = longRef.current.startPos;
      const A = longRef.current.startValue;
      if (start && A != null) {
        const target = A === 'Empty' ? 'Cross' : A === 'Cross' ? 'Empty' : null;
        if (target) setCellTo(start, target);
        else cycleCellOnce(start);
        longRef.current.applied.add(`${start.r}-${start.c}`);
      }
    }, 330);
  }

  function onGridPointerMove(e: React.PointerEvent) {
    if (!longRef.current.active) return;
    const pos = clientToCell(e.clientX, e.clientY);
    if (!pos) return;
    const last = longRef.current.lastPos;
    if (last && last.r === pos.r && last.c === pos.c) return;
    longRef.current.moved = true;
    longRef.current.lastPos = pos;
    longRef.current.touched.add(`${pos.r}-${pos.c}`);
    // moving to another cell counts as long press
    if (!longRef.current.longPress) {
      longRef.current.longPress = true;
      if (longRef.current.timerId) {
        window.clearTimeout(longRef.current.timerId);
        longRef.current.timerId = null;
      }
      // apply to start cell if not already applied
      const start = longRef.current.startPos;
      const A = longRef.current.startValue;
      if (start && A != null) {
        const key = `${start.r}-${start.c}`;
        if (!longRef.current.applied.has(key)) {
          const target = A === 'Empty' ? 'Cross' : A === 'Cross' ? 'Empty' : null;
          if (target) setCellTo(start, target);
          else cycleCellOnce(start);
          longRef.current.applied.add(key);
        }
      }
    }

    // if already in longPress mode, apply to the new cell immediately
    if (longRef.current.longPress) {
      const A = longRef.current.startValue;
      const key = `${pos.r}-${pos.c}`;
      if (!longRef.current.applied.has(key) && A != null) {
        const target = A === 'Empty' ? 'Cross' : A === 'Cross' ? 'Empty' : null;
        if (target) setCellTo(pos, target);
        else {
          // if A is Queen, do not mass-apply to other cells
        }
        longRef.current.applied.add(key);
      }
    }
  }

  function onGridPointerUp(e: React.PointerEvent) {
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {}
    const start = longRef.current.startPos;
    const wasLong = longRef.current.longPress;
    const touched = Array.from(longRef.current.touched).map((s) => {
      const [r, c] = s.split('-').map(Number);
      return { r, c };
    });

    if (longRef.current.timerId) {
      window.clearTimeout(longRef.current.timerId);
      longRef.current.timerId = null;
    }

    if (!wasLong && start) {
      // Short press: cycle the start cell once
      if (onSetCell) {
        const cur = state.cells[start.r][start.c];
        if (cur === 'Empty') onSetCell(start, 'Cross');
        else if (cur === 'Cross') onSetCell(start, 'Queen');
        else onSetCell(start, 'Empty');
      } else {
        onToggle(start);
      }
    }

    // prevent the following click event (which browsers fire after pointerup)
    ignoreClickRef.current = true;
    window.setTimeout(() => {
      ignoreClickRef.current = false;
    }, 350);

    // reset
    longRef.current.active = false;
    longRef.current.pointerId = undefined;
    longRef.current.moved = false;
    longRef.current.startPos = null;
    longRef.current.startValue = null;
    longRef.current.lastPos = null;
    longRef.current.longPress = false;
    longRef.current.touched.clear();
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
                onToggle={(pos) => {
                  if (ignoreClickRef.current) return;
                  onToggle(pos);
                }}
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
