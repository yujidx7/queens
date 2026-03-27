import { PuzzleDefinition, PuzzleState } from './puzzle';
import { CellPos } from './types';

export type HumanMove = {
  type: 'PlaceQueen' | 'MarkCross';
  pos: CellPos;
  technique: string;
};

export function findNextHumanMove(def: PuzzleDefinition, state: PuzzleState): HumanMove | null {
  const n = def.size;
  // compute candidates: true if Queen can be placed here
  const candidate: boolean[][] = Array.from({ length: n }, () => Array(n).fill(true));

  // mark cells that are not Empty as not candidate
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (state.cells[r][c] !== 'Empty') candidate[r][c] = false;
    }

  // existing queens
  const queens: CellPos[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (state.cells[r][c] === 'Queen') queens.push({ r, c });

  // apply basic eliminations: row/col/region/adjacency
  for (const q of queens) {
    for (let i = 0; i < n; i++) {
      candidate[q.r][i] = false;
      candidate[i][q.c] = false;
    }
    // adjacency
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const rr = q.r + dr,
          cc = q.c + dc;
        if (rr >= 0 && rr < n && cc >= 0 && cc < n) candidate[rr][cc] = false;
      }
    // region
    if (def.regions) {
      const rid = def.regions[q.r][q.c];
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++) {
          if (def.regions[r][c] === rid) candidate[r][c] = false;
        }
    }
  }

  // L1: Naked single checks
  // row
  for (let r = 0; r < n; r++) {
    const cols: number[] = [];
    for (let c = 0; c < n; c++) if (candidate[r][c]) cols.push(c);
    if (cols.length === 1)
      return { type: 'PlaceQueen', pos: { r, c: cols[0] }, technique: 'L1: Row single' };
  }

  // column
  for (let c = 0; c < n; c++) {
    const rows: number[] = [];
    for (let r = 0; r < n; r++) if (candidate[r][c]) rows.push(r);
    if (rows.length === 1)
      return { type: 'PlaceQueen', pos: { r: rows[0], c }, technique: 'L1: Column single' };
  }

  // region
  if (def.regions) {
    for (let rid = 0; rid < n; rid++) {
      const cells: CellPos[] = [];
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
          if (def.regions[r][c] === rid && candidate[r][c]) cells.push({ r, c });
      if (cells.length === 1)
        return { type: 'PlaceQueen', pos: cells[0], technique: 'L1: Region single' };
    }
  }

  // L2: Adjacency elimination as mark-cross suggestions
  // propose marking as Cross any Empty cell that is already impossible
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (state.cells[r][c] === 'Empty' && !candidate[r][c]) {
        return { type: 'MarkCross', pos: { r, c }, technique: 'L2: Adjacency elimination' };
      }
    }

  // L3: Line/Region Lock
  // If all candidate cells for a region lie in the same row/column,
  // then other regions cannot place in that row/column -> mark crosses.
  if (def.regions) {
    for (let rid = 0; rid < n; rid++) {
      const cells: { r: number; c: number }[] = [];
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++) {
          if (def.regions[r][c] === rid && candidate[r][c]) cells.push({ r, c });
        }
      if (cells.length > 1) {
        const sameRow = cells.every((x) => x.r === cells[0].r);
        const sameCol = cells.every((x) => x.c === cells[0].c);
        if (sameRow) {
          const row = cells[0].r;
          for (let c = 0; c < n; c++) {
            if (
              def.regions[row][c] !== rid &&
              candidate[row][c] &&
              state.cells[row][c] === 'Empty'
            ) {
              return {
                type: 'MarkCross',
                pos: { r: row, c },
                technique: `L3: Region ${rid} locked to row ${row}`,
              };
            }
          }
        }
        if (sameCol) {
          const col = cells[0].c;
          for (let r = 0; r < n; r++) {
            if (
              def.regions[r][col] !== rid &&
              candidate[r][col] &&
              state.cells[r][col] === 'Empty'
            ) {
              return {
                type: 'MarkCross',
                pos: { r, c: col },
                technique: `L3: Region ${rid} locked to col ${col}`,
              };
            }
          }
        }
      }
    }
  }

  // L4: Pair/Pattern Constraint (basic pair across regions)
  // If two regions' combined candidate cells are exactly two positions,
  // then those positions are reserved and other candidates in those rows/cols can be eliminated.
  if (def.regions) {
    for (let rid1 = 0; rid1 < n; rid1++) {
      const cells1: string[] = [];
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
          if (def.regions[r][c] === rid1 && candidate[r][c]) cells1.push(`${r},${c}`);
      for (let rid2 = rid1 + 1; rid2 < n; rid2++) {
        const cells2: string[] = [];
        for (let r = 0; r < n; r++)
          for (let c = 0; c < n; c++)
            if (def.regions[r][c] === rid2 && candidate[r][c]) cells2.push(`${r},${c}`);
        const unionSet = new Set<string>([...cells1, ...cells2]);
        if (unionSet.size === 2 && cells1.length > 0 && cells2.length > 0) {
          const union = Array.from(unionSet).map((s) => {
            const [r, c] = s.split(',').map(Number);
            return { r, c };
          });
          // eliminate other candidates in same rows/cols from other regions
          for (const u of union) {
            for (let i = 0; i < n; i++) {
              // same row
              if (
                def.regions[u.r][i] !== rid1 &&
                def.regions[u.r][i] !== rid2 &&
                candidate[u.r][i] &&
                state.cells[u.r][i] === 'Empty'
              ) {
                return {
                  type: 'MarkCross',
                  pos: { r: u.r, c: i },
                  technique: `L4: Pair lock (${rid1},${rid2})`,
                };
              }
              // same col
              if (
                def.regions[i][u.c] !== rid1 &&
                def.regions[i][u.c] !== rid2 &&
                candidate[i][u.c] &&
                state.cells[i][u.c] === 'Empty'
              ) {
                return {
                  type: 'MarkCross',
                  pos: { r: i, c: u.c },
                  technique: `L4: Pair lock (${rid1},${rid2})`,
                };
              }
            }
          }
        }
      }
    }
  }
  return null;
  // Helper: compute fresh candidate map given state and def
  function computeCandidates(defLocal: PuzzleDefinition, stateLocal: PuzzleState) {
    const n = defLocal.size;
    const cand: boolean[][] = Array.from({ length: n }, () => Array(n).fill(true));
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        if (stateLocal.cells[r][c] !== 'Empty') cand[r][c] = false;
      }
    const queens: { r: number; c: number }[] = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) if (stateLocal.cells[r][c] === 'Queen') queens.push({ r, c });
    for (const q of queens) {
      for (let i = 0; i < n; i++) {
        cand[q.r][i] = false;
        cand[i][q.c] = false;
      }
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = q.r + dr,
            cc = q.c + dc;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n) cand[rr][cc] = false;
        }
      if (defLocal.regions) {
        const rid = defLocal.regions[q.r][q.c];
        for (let r = 0; r < n; r++)
          for (let c = 0; c < n; c++) if (defLocal.regions[r][c] === rid) cand[r][c] = false;
      }
    }
    return cand;
  }

  // L5: Limited Assumption (1-step) and L6: Deeper Branching (up to depth 2)
  function contradictionIfPlace(
    defLocal: PuzzleDefinition,
    stateLocal: PuzzleState,
    place: { r: number; c: number },
    depthLimit: number,
  ): boolean {
    const n = defLocal.size;
    // clone state and place queen
    const st = JSON.parse(JSON.stringify(stateLocal)) as PuzzleState;
    st.cells[place.r][place.c] = 'Queen';

    // simple propagation: recompute candidates and apply naked singles repeatedly
    for (let iter = 0; iter < depthLimit + 5; iter++) {
      const cand = computeCandidates(defLocal, st);
      // check any row has zero candidates while no queen
      for (let r = 0; r < n; r++) {
        let hasQueen = false;
        for (let c = 0; c < n; c++)
          if (st.cells[r][c] === 'Queen') {
            hasQueen = true;
            break;
          }
        if (hasQueen) continue;
        let cnt = 0;
        for (let c = 0; c < n; c++) if (cand[r][c]) cnt++;
        if (cnt === 0) return true; // contradiction
        if (cnt === 1) {
          for (let c = 0; c < n; c++)
            if (cand[r][c]) {
              st.cells[r][c] = 'Queen';
              break;
            }
        }
      }
      // if no progress, break
    }

    if (depthLimit <= 0) return false;
    // try limited deeper branching: find a cell with two candidates and recurse
    const cand0 = computeCandidates(defLocal, st);
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (st.cells[r][c] === 'Empty' && cand0[r][c]) {
          // attempt placing here
          if (contradictionIfPlace(defLocal, st, { r, c }, depthLimit - 1)) {
            // this placement leads to contradiction
            return true;
          }
        }
    return false;
  }

  // Try L5: for each candidate cell, if placing it causes contradiction, we can mark it Cross
  const candMap = candidate;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (state.cells[r][c] !== 'Empty' || !candMap[r][c]) continue;
      // test depth 1 assumption
      if (contradictionIfPlace(def, state, { r, c }, 1)) {
        return {
          type: 'MarkCross',
          pos: { r, c },
          technique: 'L5: Limited assumption contradiction',
        };
      }
    }

  // L6: deeper branching (depth 2), if contradiction found mark cross
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (state.cells[r][c] !== 'Empty' || !candMap[r][c]) continue;
      if (contradictionIfPlace(def, state, { r, c }, 2)) {
        return { type: 'MarkCross', pos: { r, c }, technique: 'L6: Deep assumption contradiction' };
      }
    }
}
