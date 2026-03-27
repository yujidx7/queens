import { PuzzleDefinition } from './puzzle';
import { generateSolution } from './solutionGenerator';
import { buildRegions, passRegionQuality } from './regionGenerator';
import { countSolutions } from './uniquenessSolver';
import { estimateDifficulty } from './difficultyEstimator';

export class GameSessionController {
  async generatePuzzle(size: number, maxAttempts = 200): Promise<PuzzleDefinition> {
    let bestFallback: PuzzleDefinition | null = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const solution = generateSolution(size);
        const regions = buildRegions(solution, size);

        // First check uniqueness (we prefer unique puzzles even if region quality is marginal)
        const solCount = countSolutions(regions, 2);
        if (solCount !== 1) continue;

        const difficulty = estimateDifficulty(regions);

        // If regions pass quality, accept immediately
        if (passRegionQuality(regions, size)) {
          return { size, regions, solution, difficulty, seed: Date.now() };
        }

        // Otherwise keep the first unique-solution candidate as a fallback
        if (!bestFallback) {
          bestFallback = { size, regions, solution, difficulty, seed: Date.now() };
        }
        // continue searching for a higher-quality region layout
      } catch (e) {
        // generation failed (e.g. backtracking failure), continue trying
        continue;
      }
    }

    // If we couldn't find a high-quality puzzle but found at least one unique candidate, return it
    if (bestFallback) {
      console.warn('Returning fallback puzzle (unique but lower region quality) after attempts');
      return bestFallback;
    }

    // As a last resort, try one deterministic generation without quality/uniqueness checks
    try {
      const solution = generateSolution(size);
      const regions = buildRegions(solution, size);
      const difficulty = estimateDifficulty(regions);
      console.warn('Returning last-resort puzzle (no uniqueness guarantee)');
      return { size, regions, solution, difficulty, seed: Date.now() };
    } catch (e) {
      throw new Error('Failed to generate puzzle within attempts');
    }
  }
}

// static helper for convenience in tests and callers
export namespace GameSessionController {
  export async function generatePuzzle(size: number, maxAttempts = 200) {
    return new (GameSessionController as any)().generatePuzzle(size, maxAttempts);
  }
}
