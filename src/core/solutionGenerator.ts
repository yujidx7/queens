import { SolutionGrid } from './types';

// Simple backtracking generator that places one queen per row,
// ensuring no column reuse and no orthogonal/diagonal adjacency (8-neighbor forbidden).
export function generateSolution(size: number, _seed?: number): SolutionGrid {
  const colsUsed = new Array<boolean>(size).fill(false);
  const solution: number[] = new Array(size).fill(-1);

  function isAdjacent(r1: number, c1: number, r2: number, c2: number) {
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
  }

  function backtrack(row: number): boolean {
    if (row >= size) return true;
    const cols = [...Array(size).keys()];
    // randomize order
    for (let i = cols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = cols[i];
      cols[i] = cols[j];
      cols[j] = t;
    }

    for (const c of cols) {
      if (colsUsed[c]) continue;
      let ok = true;
      for (let r = 0; r < row; r++) {
        const sc = solution[r];
        if (sc === c) {
          ok = false;
          break;
        }
        if (isAdjacent(r, sc, row, c)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      // place
      solution[row] = c;
      colsUsed[c] = true;
      if (backtrack(row + 1)) return true;
      colsUsed[c] = false;
      solution[row] = -1;
    }
    return false;
  }

  const ok = backtrack(0);
  if (!ok) throw new Error('Failed to generate solution');
  return solution;
}
