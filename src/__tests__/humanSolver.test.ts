import { describe, it, expect } from 'vitest';
import { findNextHumanMove } from '../core/humanSolver';

describe('humanSolver L1', () => {
  it('finds a row naked single', () => {
    const size = 3;
    const regions = [
      [0, 1, 2],
      [0, 1, 2],
      [0, 1, 2],
    ];
    const solution = [0, 1, 2];
    const def: any = { size, regions, solution };
    const state: any = {
      cells: [
        ['Cross', 'Cross', 'Empty'],
        ['Empty', 'Empty', 'Empty'],
        ['Empty', 'Empty', 'Empty'],
      ],
      elapsedSeconds: 0,
      hintUsedCount: 0,
      mistakeCount: 0,
      isSolved: false,
    };
    const mv = findNextHumanMove(def, state);
    expect(mv).not.toBeNull();
    expect(mv!.type).toBe('PlaceQueen');
    expect(mv!.pos.r).toBe(0);
  });
});
