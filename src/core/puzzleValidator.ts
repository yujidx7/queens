import { PuzzleDefinition, PuzzleState } from './puzzle';
import { CellPos } from './types';

export type ValidationResult = { valid: boolean; reason?: string };

function isAdjacent(r1: number, c1: number, r2: number, c2: number) {
  return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
}

export function validateMove(
  state: PuzzleState,
  def: PuzzleDefinition,
  pos: CellPos,
  newState: 'Empty' | 'Queen' | 'Cross',
): ValidationResult {
  const { r, c } = pos;
  if (newState === 'Queen') {
    // check row: no other queen in same row
    for (let cc = 0; cc < def.size; cc++) {
      if (cc === c) continue;
      if (state.cells[r][cc] === 'Queen')
        return { valid: false, reason: '同じ行に別のQueenがあります' };
    }
    // check col
    for (let rr = 0; rr < def.size; rr++) {
      if (rr === r) continue;
      if (state.cells[rr][c] === 'Queen')
        return { valid: false, reason: '同じ列に別のQueenがあります' };
    }
    // region
    if (def.regions) {
      const rid = def.regions[r][c];
      for (let rr = 0; rr < def.size; rr++)
        for (let cc = 0; cc < def.size; cc++) {
          if (rr === r && cc === c) continue;
          if (def.regions[rr][cc] === rid && state.cells[rr][cc] === 'Queen')
            return { valid: false, reason: '同じ領域に別のQueenがあります' };
        }
    }
    // adjacency
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const rr = r + dr,
          cc = c + dc;
        if (rr < 0 || rr >= def.size || cc < 0 || cc >= def.size) continue;
        if (state.cells[rr][cc] === 'Queen')
          return { valid: false, reason: '近接ルールに違反します' };
      }
  }
  return { valid: true };
}

export function isSolved(state: PuzzleState, def: PuzzleDefinition): boolean {
  // each row exactly one queen
  const n = def.size;
  const colSeen = new Array<boolean>(n).fill(false);
  const regionSeen = def.regions ? new Array<boolean>(n).fill(false) : null;

  for (let r = 0; r < n; r++) {
    let rowCount = 0;
    for (let c = 0; c < n; c++) {
      if (state.cells[r][c] === 'Queen') {
        rowCount++;
        if (colSeen[c]) return false;
        colSeen[c] = true;
        if (regionSeen && def.regions) {
          const rid = def.regions[r][c];
          if (regionSeen[rid]) return false;
          regionSeen[rid] = true;
        }
        // adjacency
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const rr = r + dr,
              cc = c + dc;
            if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
            if (state.cells[rr][cc] === 'Queen') return false;
          }
      }
    }
    if (rowCount !== 1) return false;
  }
  // all columns seen
  if (colSeen.some((v) => !v)) return false;
  if (regionSeen && regionSeen.some((v) => !v)) return false;
  return true;
}
