import { RegionMap, SolutionGrid } from './types';

export function buildRegions(solution: SolutionGrid, size: number, _seed?: number): RegionMap {
  const regions: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));

  // seed each region with the queen cell; region id = row index of queen
  for (let r = 0; r < size; r++) {
    const c = solution[r];
    regions[r][c] = r;
  }

  // frontier: set of unassigned cells adjacent (4-neigh) to assigned cells
  const inFrontier = Array.from({ length: size }, () => Array(size).fill(false));
  const frontier: Array<{ r: number; c: number }> = [];

  const pushIfUnassigned = (r: number, c: number) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    if (regions[r][c] === -1 && !inFrontier[r][c]) {
      inFrontier[r][c] = true;
      frontier.push({ r, c });
    }
  };

  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  // initialize frontier
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] !== -1) {
        for (const d of dirs) pushIfUnassigned(r + d.dr, c + d.dc);
      }
    }
  }

  // randomize helper
  function randInt(n: number) {
    return Math.floor(Math.random() * n);
  }

  while (frontier.length > 0) {
    const idx = randInt(frontier.length);
    const cell = frontier.splice(idx, 1)[0];
    const { r, c } = cell;
    inFrontier[r][c] = false;

    // find neighboring assigned regions
    const neighRegions: number[] = [];
    for (const d of dirs) {
      const nr = r + d.dr,
        nc = c + d.dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      const rid = regions[nr][nc];
      if (rid !== -1) neighRegions.push(rid);
    }
    if (neighRegions.length === 0) {
      // isolate: push back later with less priority
      frontier.push(cell);
      continue;
    }

    // assign to one of neighboring regions (random)
    const rid = neighRegions[randInt(neighRegions.length)];
    regions[r][c] = rid;

    // add new frontier neighbors
    for (const d of dirs) pushIfUnassigned(r + d.dr, c + d.dc);
  }

  // as fallback, assign any remaining unassigned cells (shouldn't happen)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] === -1) {
        // pick nearest seed by Manhattan distance
        let best = 0,
          bestDist = 1e9;
        for (let rid = 0; rid < size; rid++) {
          const sr = rid,
            sc = solution[rid];
          const d = Math.abs(sr - r) + Math.abs(sc - c);
          if (d < bestDist) {
            bestDist = d;
            best = rid;
          }
        }
        regions[r][c] = best;
      }
    }
  }

  return regions;
}

export function passRegionQuality(regions: RegionMap, size: number): boolean {
  if (!regions) return false;
  const counts = new Array<number>(size).fill(0);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const id = regions[r][c];
      if (id < 0 || id >= size) return false;
      counts[id]++;
    }
  const avg = (size * size) / size; // = size
  for (const cnt of counts) {
    if (cnt < Math.max(1, Math.floor(avg / 2))) return false;
    if (cnt > avg * 3) return false;
  }
  return true;
}
