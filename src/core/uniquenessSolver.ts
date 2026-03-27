import { RegionMap } from './types';

export function countSolutions(regions: RegionMap, limit = 2): number {
  if (!regions) return 0;
  const size = regions.length;
  const colsUsed = new Array<boolean>(size).fill(false);
  const regionUsed = new Array<boolean>(size).fill(false);
  let count = 0;

  const placed: Array<{ r: number; c: number }> = [];

  function isAdjacent(r1: number, c1: number, r2: number, c2: number) {
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
  }

  // compute candidate columns for a given row considering current placement
  function candidatesForRow(row: number) {
    const cols: number[] = [];
    for (let c = 0; c < size; c++) {
      if (colsUsed[c]) continue;
      const rid = regions[row][c];
      if (rid === undefined || regionUsed[rid]) continue;
      let ok = true;
      for (const p of placed) {
        if (isAdjacent(p.r, p.c, row, c)) {
          ok = false;
          break;
        }
      }
      if (ok) cols.push(c);
    }
    return cols;
  }

  function backtrack(remainingRows: number[]) {
    if (count >= limit) return;
    if (remainingRows.length === 0) {
      count++;
      return;
    }

    // MRV heuristic: choose row with fewest candidates
    let bestRow = -1;
    let bestCols: number[] = [];
    for (const r of remainingRows) {
      const cols = candidatesForRow(r);
      if (cols.length === 0) return; // dead end, prune
      if (bestRow === -1 || cols.length < bestCols.length) {
        bestRow = r;
        bestCols = cols;
        if (bestCols.length === 1) break;
      }
    }

    // try candidates for bestRow
    for (const c of bestCols) {
      const rid = regions[bestRow][c];
      // place
      colsUsed[c] = true;
      regionUsed[rid] = true;
      placed.push({ r: bestRow, c });

      const nextRows = remainingRows.filter((x) => x !== bestRow);
      backtrack(nextRows);

      placed.pop();
      regionUsed[rid] = false;
      colsUsed[c] = false;
      if (count >= limit) return;
    }
  }

  const allRows = Array.from({ length: size }, (_, i) => i);
  backtrack(allRows);
  return count;
}
