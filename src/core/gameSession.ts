import { PuzzleDefinition } from './puzzle';
import { generateSolution } from './solutionGenerator';
import { buildRegions, passRegionQuality } from './regionGenerator';
import { countSolutions } from './uniquenessSolver';
import { estimateDifficulty } from './difficultyEstimator';

export class GameSessionController {
  async generatePuzzle(
    size: number,
    maxAttempts = 200,
    options?: { onProgress?: (attempt: number) => void; signal?: AbortSignal },
  ): Promise<PuzzleDefinition> {
    const onProgress = options?.onProgress;
    const signal = options?.signal;

    let bestFallback: PuzzleDefinition | null = null;

    // Try a bounded number of attempts first, preferring puzzles that pass region quality.
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (signal?.aborted) throw new Error('aborted');
      try {
        onProgress?.(attempt + 1);
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

    // If we found at least one unique candidate (possibly lower quality), return it
    if (bestFallback) {
      console.warn('Returning fallback puzzle (unique but lower region quality) after attempts');
      return bestFallback;
    }

    // No unique candidate found in initial attempts — continue trying until a unique puzzle is found.
    // This guarantees the method returns a puzzle with a unique solution. Yield periodically to
    // the event loop to avoid blocking the runtime.
    let extraAttempts = 0;
    while (true) {
      if (signal?.aborted) throw new Error('aborted');
      try {
        onProgress?.(maxAttempts + extraAttempts + 1);
        const solution = generateSolution(size);
        const regions = buildRegions(solution, size);
        const solCount = countSolutions(regions, 2);
        if (solCount === 1) {
          const difficulty = estimateDifficulty(regions);
          return { size, regions, solution, difficulty, seed: Date.now() };
        }
      } catch (e) {
        // continue trying
      }
      extraAttempts++;
      if (extraAttempts % 100 === 0) await new Promise((r) => setTimeout(r, 0));
    }
  }
}

// static helper for convenience in tests and callers
export namespace GameSessionController {
  export async function generatePuzzle(size: number, maxAttempts = 200) {
    return new (GameSessionController as any)().generatePuzzle(size, maxAttempts);
  }
}
