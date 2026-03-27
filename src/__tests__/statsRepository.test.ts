import '../setupTests';
import { describe, it, expect, beforeEach } from 'vitest';
import { loadStats, clearStats, recordClear } from '../core/statsRepository';

describe('statsRepository', () => {
  beforeEach(() => localStorage.clear());

  it('records clears and updates best time', () => {
    const rec = {
      timestamp: Date.now(),
      size: 8,
      timeSeconds: 120,
      hintsUsed: 1,
      difficultyLabel: 'Normal',
    };
    recordClear(rec);
    const s = loadStats();
    expect(s.totalClears).toBe(1);
    expect(s.bestTimes['8']).toBe(120);
    expect(s.difficultyCounts['Normal']).toBe(1);
  });

  it('clearStats removes data', () => {
    recordClear({ timestamp: Date.now(), size: 7, timeSeconds: 100, hintsUsed: 0 });
    clearStats();
    const s = loadStats();
    expect(s.totalClears).toBe(0);
  });
});
