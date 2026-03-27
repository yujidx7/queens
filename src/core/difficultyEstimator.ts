import { RegionMap } from './types';

export type DifficultyRating = { label: string; stars: number; score: number };

// Simple placeholder estimator: scores by variance of region sizes.
export function estimateDifficulty(regions: RegionMap): DifficultyRating {
  if (!regions) return { label: 'Unknown', stars: 1, score: 0 };
  const size = regions.length;
  const counts = new Array<number>(size).fill(0);
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) counts[regions[r][c]]++;
  const avg = counts.reduce((a, b) => a + b, 0) / size;
  const variance = counts.reduce((a, b) => a + (b - avg) * (b - avg), 0) / size;
  const score = Math.min(100, Math.round(variance));
  let label = 'Normal';
  let stars = 3;
  if (score < 8) {
    label = 'Easy';
    stars = 2;
  } else if (score < 20) {
    label = 'Normal';
    stars = 3;
  } else if (score < 40) {
    label = 'Hard';
    stars = 4;
  } else {
    label = 'Expert';
    stars = 5;
  }
  return { label, stars, score };
}
