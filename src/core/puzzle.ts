import { SolutionGrid, RegionMap, DifficultyRating } from './types';

export type PuzzleDefinition = {
  size: number;
  regions: RegionMap;
  solution: SolutionGrid;
  difficulty: DifficultyRating;
  seed: number;
};

export type PuzzleState = {
  cells: ('Empty' | 'Queen' | 'Cross')[][];
  elapsedSeconds: number;
  hintUsedCount: number;
  mistakeCount: number;
  isSolved: boolean;
};

export function createEmptyState(size: number): PuzzleState {
  return {
    cells: Array.from({ length: size }, () =>
      Array.from({ length: size }, () => 'Empty' as 'Empty'),
    ),
    elapsedSeconds: 0,
    hintUsedCount: 0,
    mistakeCount: 0,
    isSolved: false,
  };
}
