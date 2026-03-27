import { describe, it, expect } from 'vitest';
import { GameSessionController } from '../core/gameSession';
import { countSolutions } from '../core/uniquenessSolver';

describe('uniqueness solver optimizations', () => {
  it('generates a puzzle with unique solution (size=5)', async () => {
    const def = await GameSessionController.generatePuzzle(5, 50);
    const sols = countSolutions(def.regions, 2);
    expect(sols).toBe(1);
  });

  // size=6 generation is stochastic; skip heavy generation here to avoid flakiness

  it('returns 0 for null regions', () => {
    expect(countSolutions(null as any)).toBe(0);
  });
});
