import { describe, it, expect } from 'vitest';
import { generateSolution } from '../core/solutionGenerator';

describe('generateSolution', () => {
  it('generates valid solution for size 8', () => {
    const size = 8;
    const sol = generateSolution(size);
    expect(sol.length).toBe(size);
    // columns unique
    const set = new Set(sol);
    expect(set.size).toBe(size);
    // adjacency not violated
    for (let r = 0; r < size; r++)
      for (let r2 = 0; r2 < size; r2++) {
        if (r === r2) continue;
        const c1 = sol[r],
          c2 = sol[r2];
        expect(Math.abs(r - r2) > 1 || Math.abs(c1 - c2) > 1).toBe(true);
      }
  });
});
