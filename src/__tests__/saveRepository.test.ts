import '../setupTests';
import { describe, it, expect, beforeEach } from 'vitest';
import { saveSession, loadSession, clearSession } from '../core/saveRepository';

describe('saveRepository', () => {
  beforeEach(() => localStorage.clear());

  it('saves and loads session including history and future', () => {
    const def = {
      size: 3,
      regions: [
        [0, 1, 2],
        [0, 1, 2],
        [0, 1, 2],
      ],
      solution: [0, 1, 2],
      difficulty: null,
      seed: 1,
    };
    const state = {
      cells: [
        ['Empty', 'Empty', 'Empty'],
        ['Empty', 'Empty', 'Empty'],
        ['Empty', 'Empty', 'Empty'],
      ],
      elapsedSeconds: 0,
      hintUsedCount: 0,
      mistakeCount: 0,
      isSolved: false,
    };
    const history = [state];
    const future = [];
    saveSession(def as any, state as any, history as any, future as any);
    const loaded = loadSession();
    expect(loaded).not.toBe(null);
    expect(loaded!.def.size).toBe(3);
    expect(loaded!.history).toBeDefined();
  });

  it('clearSession removes saved data', () => {
    const def = { size: 2 } as any;
    saveSession(def, {} as any);
    clearSession();
    expect(loadSession()).toBeNull();
  });
});
